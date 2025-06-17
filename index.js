#!/usr/bin/env node

import inquirer from 'inquirer';
import axios from 'axios';

const API_URL = 'http://10.0.0.140:1234/v1/chat/completions';  // Change to localhost for testing

async function checkServer() {
  try {
    await axios.get(API_URL.replace('/chat/completions', ''));
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to LM Studio. Please make sure:');
      console.error('1. LM Studio is running');
      console.error('2. You have started the local server in LM Studio');
      console.error('3. The server is running on port 1234');
    } else {
      console.error('❌ Error connecting to server:', error.message);
    }
    return false
    ;
  }
}

async function askQuestion() {
  const { userPrompt } = await inquirer.prompt([
    {
      type: 'input',
      name: 'userPrompt',
      message: 'Enter your prompt (or type "exit" to quit):',
    },
  ]);

  return userPrompt;
}

async function processStream(response) {
  try {
    console.log('Starting to process stream...');
    let buffer = '';
    
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
            if (text) process.stdout.write(text);
          } catch (e) {
            console.error('Error parsing JSON:', e.message);
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
          if (text) process.stdout.write(text);
        } catch (e) {
          console.error('Error parsing final JSON:', e.message);
        }
      }
    }
    
    console.log('\n'); // Add newline at the end
  } catch (error) {
    console.error('Error processing stream:', error.message);
  }
}

async function getCompletion(prompt) {
  try {
    console.log('Sending request to API...');
    const response = await axios.post(API_URL, {
      model: 'local-model',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      stream: true
    }, {
      responseType: 'stream',
      headers: {
        'Accept': 'text/event-stream',
        'Content-Type': 'application/json',
      }
    });

    await processStream(response);
  } catch (error) {
    console.error('❌ Failed to get response:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

async function main() {
  if (!await checkServer()) {
    return;
  }

  // Check if we have command line arguments
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // If we have arguments, use them as the prompt
    const prompt = args.join(' ');
    await getCompletion(prompt);
    return;
  }

  console.log('model loaded properly.\n');

  // Interactive mode
  while (true) {
    const userPrompt = await askQuestion();
    
    if (userPrompt.toLowerCase() === 'exit') {
      console.log('\n👋 Goodbye!');
      break;
    }

    await getCompletion(userPrompt);
  }
}

main();
