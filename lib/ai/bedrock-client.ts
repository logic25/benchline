import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

// AWS Bedrock client for LLM calls. Bedrock is used instead of the public
// Anthropic API so report data is processed under AWS's zero-data-retention
// terms (request model access for the model below in the us-east-1 console).
//
// Credentials and region come from the environment (AWS_REGION,
// AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY). These are server-only — never
// import this module from a client component.

export const BEDROCK_MODEL = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-sonnet-4-20250514-v1:0';

let client: BedrockRuntimeClient | null = null;

function getClient(): BedrockRuntimeClient {
  if (!client) {
    client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
  }
  return client;
}

// Invoke Claude on Bedrock with a single user prompt and return the text. Throws
// if the response cannot be parsed.
export async function invokeClaude(prompt: string, maxTokens: number = 1024): Promise<string> {
  const command = new InvokeModelCommand({
    modelId: BEDROCK_MODEL,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
    }),
  });

  const response = await getClient().send(command);
  const decoded = JSON.parse(new TextDecoder().decode(response.body));
  const text = decoded?.content?.[0]?.text;
  if (typeof text !== 'string') {
    throw new Error('Unexpected Bedrock response shape');
  }
  return text;
}
