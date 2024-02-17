import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";



export async function usePolly(text, 
                               accessKey,
                               secretKey,
                               sessionToken
                               )
 {
    const client = new PollyClient({
        region: import.meta.env.VITE_REGION_NAME,
        credentials: {
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
            sessionToken:sessionToken
        },
    });

    
    const input = {
        "Engine": "neural",
        "OutputFormat": "mp3",
        "SampleRate": "16000",
        "Text": text,
        "TextType": "text",
        "LanguageCode": 'en-US',
        "VoiceId": 'Arthur'
      };
  
      const command = new SynthesizeSpeechCommand(input);
      const response = await client.send(command);
      return response;

  }