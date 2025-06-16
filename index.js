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
    return false;
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

async function main() {
  if (!await checkServer()) {
    return;
  }

  console.log('model loaded properly.\n');

  while (true) {
    const userPrompt = await askQuestion();
    
    if (userPrompt.toLowerCase() === 'exit') {
      console.log('\n👋 Goodbye!');
      break;
    }

    try {
      const response = await axios.post(API_URL, {
        model: 'local-model',
        messages: [
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      });

      const content = response.data.choices?.[0]?.message?.content;
      console.log(content);
    } catch (error) {
      console.error('❌ Failed to get response:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
    }
  }
}

main();
