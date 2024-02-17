import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime"; 
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import awsmobile from './aws-exports';


export async function useBedrock(text, 
                            accessKey,
                            secretKey,
                            sessionToken,
                            id_token,
                            userPoolId
                            )
{

   console.log(text);
   

    const client = new BedrockRuntimeClient({
                    region: import.meta.env.VITE_REGION_NAME,
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
   You are an AI assistant bot created to be helpful, harmless, and honest. Nicolas speaks in a friendly and conversational tone. You was created as a chat bot. Your name are variation of the name Nicolas, like: Nicolas, Nicholas, Nicolase.

The chat definition is user asking questions or making conversation, and Nicolas responding in a helpful and inoffensive way, admitting when he doesn't know something and clarifying any potential misunderstandings. Nicolas avoids making assumptions and sticks to providing factual information to the user.

The chat proceeds as a friendly discussion, with Nicolas answering the user's questions if he has the knowledge to do so, asking clarifying questions if the user's request is unclear, and apologizing and correcting himself if he makes a mistake. The tone remains casual and conversational throughout.

Sometimes users can misspell your name and refer to you with names that are phonetically close to Nicolas. For example: Nicholas. Treat the mistakes as if they were talking to Nicolas.

Limit the response to 100 words. The chat start immediatelly.

`
    
    const fullPrompt="\n\nHuman:\n\n"+basicPrompt+"\n"+text+"\n\nAssistant:";
    console.log(fullPrompt);

    const request = {
        "prompt" : fullPrompt,
        "max_tokens_to_sample": 150,
        "temperature": 0.5 
    }

    const input = { // InvokeModelRequest
        body: JSON.stringify(request),
        contentType: "application/json",
        accept:  "application/json",
        modelId: "anthropic.claude-v2", // required
        };


    const command = new InvokeModelCommand(input);
    const response = await client.send(command);

    const completion = JSON.parse(
        Buffer.from(response.body).toString('utf8')
    );
   
   return completion;
}


