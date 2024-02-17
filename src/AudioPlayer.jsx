import { useRef, useEffect } from "react";

export const  AudioPlayer = ({audioFile})=>{

  const audioRef = useRef();
  
  useEffect(() => {
    (async () => {
      try {
     if (audioFile)
       {
       
        const audioArrayBuffer =  await audioFile.AudioStream.transformToByteArray()
        const audioURL = URL.createObjectURL(new Blob([audioArrayBuffer],{type: "audio/mpeg"}));
        const audio=audioRef.current;
        audio.src = audioURL;
        audio.play();
        return ()=>{
            URL.revokeObjectURL(audioURL);
        }

       }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [audioFile]);


return (
    <div>
        <audio ref={audioRef} autoPlay ></audio>
       
    </div>
)

}
export default AudioPlayer