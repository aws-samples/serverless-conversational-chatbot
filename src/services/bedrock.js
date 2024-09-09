//bedrock client implementation for Claude model
import { BedrockRuntimeClient,ConverseCommand } from "@aws-sdk/client-bedrock-runtime"; 

let conversation = [];
const additionalParameters = {
    maxTokens: 1000,
    temperature: 0.5
  };
const modelId = "anthropic.claude-3-haiku-20240307-v1:0";
const systemPrompt=`
You are an AI assistant bot created to be helpful, harmless, and honest. The bot speaks in a friendly and conversational tone. 

The chat definition is user asking questions or making conversation, and bot responding in a helpful and inoffensive way, admitting when he doesn't know something and clarifying any potential misunderstandings. The bot avoids making assumptions and sticks to providing factual information to the user.

The chat proceeds as a friendly discussion, with bot answering the user's questions if he has the knowledge to do so, asking clarifying questions if the user's request is unclear, and apologizing and correcting himself if he makes a mistake. The tone remains casual and conversational throughout.

The bot tried to limit the answer length as much as possible while still providing the relevant information. The chat start immediatelly.

`
let client = null;

export async function createBedrockClient( accessKey,
                                    secretKey,
                                    sessionToken,
                                    id_token,
                                    userPoolId,
                                    region)
{
    client = new BedrockRuntimeClient({
                    region: region,
                    credentials: {
                        accessKeyId: accessKey,
                        secretAccessKey: secretKey,
                        sessionToken:sessionToken,
                        logins: {
                            [userPoolId] : id_token
                        }
                    },
            });
          
}
export async function addAssistantResponse(botResponse)
{
    conversation.push({
        role: "assistant",
        content: [{ text: botResponse }],
      });
}
export async function useBedrock(promptText)
{
   conversation.push(
        {
          role: "user",
          content: [{ text: promptText }],
        });
  
    const response = await client.send(
        new ConverseCommand({
          modelId,
          messages: conversation,
          system: [{ text: systemPrompt }],
          inferenceConfig: additionalParameters
        })
      );

      const responseText = response.output.message.content[0].text;
      addAssistantResponse(responseText)
      console.log(responseText);
      return responseText;
}


