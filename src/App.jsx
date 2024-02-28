import { useState, useRef,useEffect } from 'react';
import './App.css';
import { AppBar, Toolbar, Button, Typography, Stack ,Switch,FormGroup,FormControlLabel} from "@mui/material";
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
     
        const { accessToken, idToken } = (await fetchAuthSession({ forceRefresh: true })).tokens ?? {};
    
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
      
        console.log('user have been signedOut successfully.');
        break;
      
    }
  });

  //hubListenerCancelToken();

  const welcomeMsg = 'I am a chatbot based on Amazon Bedrock. I will address your questions. To interact with me, press and hold the Talk button. When you finish talking, release the Talk button, and I will provide the answer.';
  const [jwtToken, setJwtToken] = useState('');
  const [accessKeyId, setAccessKeyId] = useState()
  const [secretAccessKey, setSecretAccessKey] = useState()
  const [sessionToken, setSessionToken] = useState()
  const [rows, setRows] = useState([])
  const [audioFile, setAudioFile] = useState();
  const [chat, setChat] = useState('');
  const ODD_OPACITY = 0.2;
  const childRef = useRef();


  //We used the useEffect hook because we want to make sure the ref has been set on the 
  //element and the element has been rendered to the DOM.
  useEffect(() => {
    const element = childRef.current;
    console.log(element); // 👈️ element here
  }, []);

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
    //console.log("isStopListeningMode1 "+isStopListeningMode);
    setRows((prevRows) => [...prevRows, { id: prevRows.length + 1, col1: speaker, col2: text }]);
   // console.log(speaker);
    if (speaker=="Bot") 
    {
     await invokePolly(text);
     /*if (isClickToTalk)
     {
       console.log(isClickToTalk);
       childRef.current.startRecordingExternally(isStopListeningMode);
     }*/
    }
    else if (!isIgnoreForBedrock)
    {
        console.log(isIgnoreForBedrock);
        let chatHistory = chat+("\n"+text);
        let response = await invokeBedrock(chatHistory);
    
        let answer  = response.completion;
      
        chatHistory +=("\nBot: "+answer);
        setChat(chatHistory);
       
        await handleAddRow(answer,"Bot",false);

    }
   
  };

  return (
    <>
      
      <Authenticator hideSignUp={true}>
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
  {/*}
  <FormGroup>
  <FormControlLabel control={<Switch color="warning" 
                              defaultChecked={!isClickToTalk} 
                              onChange={(e) => 
                                {
                                  SetIsClickToTalk(e.target.checked);
                                  if (e.target.checked)
                                  {
                                    childRef.current.startRecordingExternally();
                                  }
                                  else
                                  {
                                    childRef.current.stopRecordingExternally();
                                  }
                                 
                                }}
                              />} label="Touchless speaking" />
</FormGroup>
                              */}
  </Stack>
  {/*Since we use async call to Identity pool, we have to wait for AWS credentials to be ready */}
  {accessKeyId && <Transcribe accessKeyId={accessKeyId} secretAccessKey={secretAccessKey} sessionToken={sessionToken} handleAddRow={handleAddRow}
    ref={childRef} />}
     <AudioPlayer audioFile={audioFile} />
</Toolbar>
</AppBar>

<div style={{ height: 400, width: '100%', marginTop: '50px' }}>
<StripedDataGrid autoHeight disableColumnMenu={true} sortable={false}
  rows={rows} columns={columns} getRowHeight={() => 'auto'}
  getRowClassName={(params) =>
    params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
  }
/>
</div>
        </main>
      )}
    </Authenticator>
     
    </>
  )
}

export default App;
