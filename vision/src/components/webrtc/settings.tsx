import React, { useEffect, useState } from "react";

const logger = console;

interface MediaKinds {
  audioOut: MediaDeviceInfo[],
  audioIn: MediaDeviceInfo[],
  videoIn: MediaDeviceInfo[]
}

const webcamSettings = () => {
  let kinds: MediaKinds = {
    videoIn: [],
    audioIn: [],
    audioOut: []
  };

  const [devices, setKinds] = useState(kinds);

  useEffect(() => {
    const getDevs = async () => {
      let stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      let devs = await navigator.mediaDevices.enumerateDevices();
      let mediaDevs = devs.reduce((acc, dev) => {
        switch(dev.kind) {
          case "audioinput":
            acc.audioIn.push(dev);
            break;
          case "audiooutput":
            acc.audioOut.push(dev);
            break;
          case "videoinput":
            acc.videoIn.push(dev)
            break;
          default:
            logger.log("Unknown device type");
        }
        return acc
      }, kinds)      
      setKinds(mediaDevs)
    }

    getDevs();
  }, [])

  return (
    <div className="nested-menu">
      <label>Video</label>
      <select name="video">
        { 
          devices.videoIn.map(dev => {
            let val = dev.label || dev.deviceId;
            logger.log("video: ", val);
            <option value={ val }>{ val }</option>
          })
        }
      </select>
      <label>Speakers</label>
      <select name="speakers">
        { 
          devices.audioOut.map(dev => {
            let val = dev.label || dev.deviceId;
            <option value={ val }>{ val }</option>
          })
        }
      </select>
{/*       <label>Microphone</label>
      <select name="microphone">{ audioIn }</select> */}
    </div>
  )
}

export default webcamSettings;