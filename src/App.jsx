import { useState, useRef } from 'react';
import './App.css';
import { AppBar, Toolbar, Button, Typography, Stack } from "@mui/material";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import Transcribe from './Transcribe';
import { usePolly } from "./polly"
import { useBedrock } from "./bedrock"
import AudioPlayer from "./AudioPlayer";
import { Amplify } from 'aws-amplify';
import { fetchAuthSession,signOut,getCurrentUser } from 'aws-amplify/auth';
import awsconfig from './aws-exports';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Hub } from 'aws-amplify/utils';


import { alpha, styled } from '@mui/material/styles';
import { DataGrid, gridClasses } from '@mui/x-data-grid';
import awsmobile from './aws-exports';

Amplify.configure(awsconfig);

function App() {
  const identityPoolId = import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID;
  const regionName = import.meta.env.VITE_REGION_NAME;
  const UserPoolId = "cognito-idp."+regionName+".amazonaws.com/"+awsmobile.aws_user_pools_id
     
  const hubListenerCancelToken = Hub.listen('auth',async ({ payload }) => {
    switch (payload.event) {
      case 'signedIn':  
      console.log('1111111111')
      
      
      try {
        const { username, userId, signInDetails } = await getCurrentUser();
        console.log(`The username: ${username}`);
        console.log(`The userId: ${userId}`);
        console.log(`The signInDetails: ${signInDetails}`);
      } catch (err) {
        console.log(err);
      }





        const { accessToken, idToken } = (await fetchAuthSession()).tokens ?? {};
          
        setJwtToken(idToken.toString());
        const client = new CognitoIdentityClient({
          region: regionName,
          credentials: fromCognitoIdentityPool({
            clientConfig: { region: regionName },
            identityPoolId: awsmobile.aws_cognito_identity_pool_id,
            region: regionName,
            logins: {
              [UserPoolId] : idToken.toString()
            }
  
          })
        });
        const credentials = await client.config.credentials()
   
        setAccessKeyId(credentials.accessKeyId);
        setSecretAccessKey(credentials.secretAccessKey);
        setSessionToken(credentials.sessionToken);

        break;
      case 'signedOut':
        //clearStates();
        console.log('user have been signedOut successfully.');
        break;
      
    }
  });

  //hubListenerCancelToken();

  const welcomeMsg = 'Hello. My Name is Nicolas. You can ask me anything, but you should start your question with "Nicolas".';
  const [jwtToken, setJwtToken] = useState('');
  const [accessKeyId, setAccessKeyId] = useState()
  const [secretAccessKey, setSecretAccessKey] = useState()
  const [sessionToken, setSessionToken] = useState()
  const [rows, setRows] = useState([])
  const [audioFile, setAudioFile] = useState();
  const [chat, setChat] = useState('');
  const ODD_OPACITY = 0.2;
  const childRef = useRef();



  const clearStates = ()=>
  {
    setRows([]);
    setSecretAccessKey('');
    setAccessKeyId('');
    setSessionToken('');
    setJwtToken('');
    setChat('');
  } 



  //get textual input and convert the text to speech by using Amazon Polly service
  const invokePolly = (text) => {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          let results = setAudioFile(await usePolly(text, accessKeyId, secretAccessKey, sessionToken,jwtToken))
          return resolve(results);
        } catch (err) {
          return reject(err);
        }
      })()
    });
  }

  const invokeBedrock = async (text) => {
    return await useBedrock(text, accessKeyId, secretAccessKey, sessionToken,UserPoolId,jwtToken)
  }


  const StripedDataGrid = styled(DataGrid)(({ theme }) => ({
    [`& .${gridClasses.row}.even`]: {
      backgroundColor: theme.palette.grey[200],
      '&:hover, &.Mui-hovered': {
        backgroundColor: alpha(theme.palette.primary.main, ODD_OPACITY),
        '@media (hover: none)': {
          backgroundColor: 'transparent',
        },
      },
      '&.Mui-selected': {
        backgroundColor: alpha(
          theme.palette.primary.main,
          ODD_OPACITY + theme.palette.action.selectedOpacity,
        ),
        '&:hover, &.Mui-hovered': {
          backgroundColor: alpha(
            theme.palette.primary.main,
            ODD_OPACITY +
            theme.palette.action.selectedOpacity +
            theme.palette.action.hoverOpacity,
          ),
          // Reset on touch devices, it doesn't add specificity
          '@media (hover: none)': {
            backgroundColor: alpha(
              theme.palette.primary.main,
              ODD_OPACITY + theme.palette.action.selectedOpacity,
            ),
          },
        },
      },
    },
  }));


  const columns = [
    {
      field: 'col1', headerName: '', width: 100, sortable: false, renderCell: (params) => (
        <Typography sx={{ color: "blue" }}>{params.value} </Typography>
      )
    },
    { field: 'col2', headerName: 'History', width: 600, sortable: false },
  ];

  const  handleAddRow = async (text, speaker,isIgnoreForBedrock) => {
    setRows((prevRows) => [...prevRows, { id: prevRows.length + 1, col1: speaker, col2: text }]);
    
    if (speaker=="Bot") 
    {
     await invokePolly(text);
    }
    else if (!isIgnoreForBedrock)
    {
        let chatHistory = chat+("\n"+text);
        let response = await invokeBedrock(chatHistory);
        console.log(response);
        let answer  = response.completion;
        console.log(answer);
        chatHistory +=("\nBot: "+answer);
        setChat(chatHistory);
        await handleAddRow(answer,"Bot",false);
        //setRows((prevRows) => [...prevRows, { id: prevRows.length + 1, col1: "Bot", col2: answer }]);
       // await invokePolly(answer);
    }
   
  };

  return (
    <>
      
      <Authenticator>
      {({ signOut, user }) => (
        <main>
 <AppBar>

<Toolbar>
  <Stack spacing={2} direction="row" sx={{ m: 2 }} > 
  <Button variant="contained" onClick={async (e) => {
          await invokePolly(welcomeMsg);
          await handleAddRow(welcomeMsg, "Bot",true);
        }}>Guide Me
  </Button>
  <Button variant="contained" onClick={() => {
                      signOut();
        }}>Sign Out
  </Button>

  </Stack>
  {/*Since we use async call to Identity pool, we have to wait for AWS credentials to be ready */}
  {accessKeyId && <Transcribe accessKeyId={accessKeyId} secretAccessKey={secretAccessKey} sessionToken={sessionToken} handleAddRow={handleAddRow}
    ref={childRef} />}
</Toolbar>
</AppBar>

<div style={{ height: 400, width: '100%', marginTop: '50px' }}>
<StripedDataGrid autoHeight disableColumnMenu={true} sortable={false}
  rows={rows} columns={columns} getRowHeight={() => 'auto'}
  getRowClassName={(params) =>
    params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
  }
/>
<Button variant="contained"
  onClick={
    (e) => {
      childRef.current.startRecordingExternally();
      handleAddRow("kuku");
    }
  }>add</Button>
</div>
        </main>
      )}
    </Authenticator>
      <AudioPlayer audioFile={audioFile} />
    </>
  )
}

export default App;
