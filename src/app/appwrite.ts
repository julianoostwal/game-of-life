import { Client, Account } from 'appwrite';

export const client = new Client();

client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('66df04f100354f558a76');

export const account = new Account(client);
export { ID } from 'appwrite';
