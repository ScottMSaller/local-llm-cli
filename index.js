#!/usr/bin/env node

import inquirer from 'inquirer';
import axios from 'axios';
import chalk from 'chalk';
import ora from 'ora';
import { program } from 'commander';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory where the script is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the script's directory
dotenv.config({ path: join(__dirname, '.env') });

if (!process.env.LOCAL_URL) {
  console.error(chalk.red('Error: LOCAL_URL environment variable is not set'));
  console.error(chalk.yellow('Please create a .env file in the installation directory with:'));
  console.error(chalk.yellow('LOCAL_URL=http://your-lm-studio-url:1234'));
  process.exit(1);
}

const API_URL = process.env.LOCAL_URL + '/v1/chat/completions';

// Configure command line options
program
  .version('1.0.0')
  .option('-t, --temperature <number>', 'Set the temperature (0.0 to 2.0)', '0.7')
  .option('-m, --model <string>', 'Set the model name', 'local-model')
  .argument('[prompt...]', 'The prompt to send to the model')
  .parse(process.argv);

const options = program.opts();
const promptArgs = program.args;

async function checkServer() {
  const spinner = ora('Checking LM Studio connection...').start();
  try {
    await axios.get(API_URL.replace('/chat/completions', ''));
    spinner.succeed(chalk.green('Connected to LM Studio'));
    return true;
  } catch (error) {
    spinner.fail(chalk.red('Failed to connect to LM Studio'));
    if (error.code === 'ECONNREFUSED') {
      console.error(chalk.red('Please make sure:'));
      console.error(chalk.yellow('1. LM Studio is running'));
      console.error(chalk.yellow('2. You have started the local server in LM Studio'));
      console.error(chalk.yellow('3. The server is running on port 1234'));
    } else {
      console.error(chalk.red('Error connecting to server:', error.message));
    }
    return false;
  }
}

async function askQuestion(history = []) {
  const { userPrompt } = await inquirer.prompt([
    {
      type: 'input',
      name: 'userPrompt',
      message: chalk.cyan('Enter your prompt (or type "exit" to quit):'),
      history: history
    },
  ]);

  return userPrompt;
}

async function processStream(response, messages) {
  try {
    let buffer = '';
    let firstToken = true;
    const spinner = ora('Thinking...').start();
    let fullResponse = '';
    
    for await (const chunk of response.data) {
      const lines = (buffer + chunk.toString()).split('\n');
      buffer = lines.pop(); // Keep the last partial line in the buffer
      
      for (const line of lines) {
        if (line.trim().startsWith('data: ')) {
          const jsonStr = line.slice(6); // Remove 'data: ' prefix
          if (jsonStr.trim() === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed.choices?.[0]?.delta?.content || '';
            if (text) {
              if (firstToken) {
                spinner.stop();
                firstToken = false;
              }
              process.stdout.write(chalk.red(text));
              fullResponse += text;
            }
          } catch (e) {
            console.error(chalk.red('Error parsing JSON:', e.message));
          }
        }
      }
    }
    
    // Process any remaining buffer
    if (buffer.trim().startsWith('data: ')) {
      const jsonStr = buffer.slice(6);
      if (jsonStr.trim() !== '[DONE]') {
        try {
          const parsed = JSON.parse(jsonStr);
          const text = parsed.choices?.[0]?.delta?.content || '';
          if (text) {
            process.stdout.write(chalk.red(text));
            fullResponse += text;
          }
        } catch (e) {
          console.error(chalk.red('Error parsing final JSON:', e.message));
        }
      }
    }
    
    console.log('\n'); // Add newline at the end
    if (firstToken) spinner.stop();
    
    // Add assistant's response to messages
    messages.push({ role: 'assistant', content: fullResponse });
    return messages;
  } catch (error) {
    console.error(chalk.red('Error processing stream:', error.message));
    return messages;
  }
}

async function getCompletion(prompt, messages = []) {
  try {
    // Add user's message to history
    messages.push({ role: 'user', content: prompt });
    
    const response = await axios.post(API_URL, {
      model: options.model,
      messages: messages,
      temperature: parseFloat(options.temperature),
      stream: true
    }, {
      responseType: 'stream',
      headers: {
        'Accept': 'text/event-stream',
        'Content-Type': 'application/json',
      }
    });

    return await processStream(response, messages);
  } catch (error) {
    console.error(chalk.red('❌ Failed to get response:', error.message));
    if (error.response) {
      console.error(chalk.red('Status:', error.response.status));
      console.error(chalk.red('Data:', error.response.data));
    }
    return messages;
  }
}

async function main() {
  if (!await checkServer()) {
    return;
  }

  // If prompt was provided as command line argument, use it
  if (promptArgs.length > 0) {
    const prompt = promptArgs.join(' ');
    await getCompletion(prompt);
    return;
  }

  console.log(chalk.cyan('\nWelcome to Guru CLI! 🧘‍♂️'));
  console.log(chalk.gray('Current settings:'));
  console.log(chalk.gray(`- Temperature: ${options.temperature}`));
  console.log(chalk.gray(`- Model: ${options.model}`));
  console.log(chalk.gray('- Conversation memory: enabled'));
  console.log();

  // Interactive mode with command history and conversation memory
  const history = [];
  let messages = [];  // Store conversation history
  
  while (true) {
    const userPrompt = await askQuestion(history);
    history.push(userPrompt);
    
    if (userPrompt.toLowerCase() === 'exit') {
      console.log(chalk.cyan('\n👋 Goodbye!'));
      break;
    }
    
    if (userPrompt.toLowerCase() === 'clear') {
      messages = [];
      console.log(chalk.yellow('\nConversation memory cleared!'));
      continue;
    }

    messages = await getCompletion(userPrompt, messages);
  }
}

main();
