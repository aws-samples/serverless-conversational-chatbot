//bedrock client implementation for Claude model
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime"; 

export async function useBedrock(text, 
                            accessKey,
                            secretKey,
                            sessionToken,
                            id_token,
                            userPoolId,
                            region
                            )
{

    const client = new BedrockRuntimeClient({
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

    const basicPrompt=`
        You are an AI assistant bot created to be helpful, harmless, and honest. The bot speaks in a friendly and conversational tone. 

        The chat definition is user asking questions or making conversation, and bot responding in a helpful and inoffensive way, admitting when he doesn't know something and clarifying any potential misunderstandings. The bot avoids making assumptions and sticks to providing factual information to the user.

        The chat proceeds as a friendly discussion, with bot answering the user's questions if he has the knowledge to do so, asking clarifying questions if the user's request is unclear, and apologizing and correcting himself if he makes a mistake. The tone remains casual and conversational throughout.

        The bot tried to limit the answer length as much as possible while still providing the relevant information. The chat start immediatelly.

        `
    
    const fullPrompt="\n\nHuman:\n\n"+basicPrompt+"\n"+text+"\n\nAssistant:";
    console.log(fullPrompt);

    const request = {
        "prompt" : fullPrompt,
        "max_tokens_to_sample": 150,
        "temperature": 0.5
        
    }

    const input = { 
        // InvokeModelRequest
        body: JSON.stringify(request),
        contentType: "application/json",
        accept:  "application/json",
        modelId: "anthropic.claude-v2:1"
        };


    const command = new InvokeModelCommand(input);
    const response = await client.send(command);

    const completion = JSON.parse(
        Buffer.from(response.body).toString('utf8')
    );
   
   return completion;
}


