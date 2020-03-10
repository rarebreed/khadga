import React, { useEffect, useState } from "react";

const logger = console;

interface MediaKinds {
  audioOut: MediaDeviceInfo[],
  audioIn: MediaDeviceInfo[],
  videoIn: MediaDeviceInfo[]
}

const webcamSettings = () => {
  const kinds: MediaKinds = {
    videoIn: [],
    audioIn: [],
    audioOut: []
  };

  const [devices, setKinds] = useState(kinds);

  useEffect(() => {
    const getDevs = async () => {
/*       const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }); */

      const devs = await navigator.mediaDevices.enumerateDevices();
      const mediaDevs = devs.reduce((acc, dev) => {
        switch(dev.kind) {
          case "audioinput":
            acc.audioIn.push(dev);
            break;
          case "audiooutput":
            acc.audioOut.push(dev);
            break;
          case "videoinput":
            acc.videoIn.push(dev);
            break;
          default:
            logger.log("Unknown device type");
        }
        return acc;
      }, kinds);
      setKinds(mediaDevs);
    };

    getDevs();
  }, []);

  /**
   * Handles what happens when the user selects a choice
   */
  const selected = (opt: string) => (evt: React.SyntheticEvent<HTMLSelectElement, Event>) => {
    logger.log(`For ${opt} you selected: `, evt.currentTarget.value);
  };
  const selectedVideo = selected("video");
  const selectedAudioOut = selected("speakers");
  const selectedAudioIn = selected("microphone");

  return (
    <div className="nested-menu">
      <label>Video</label>
      <select name="video" onChange={ selectedVideo }>
        {
          devices.videoIn.map(dev => {
            const val = dev.label || dev.deviceId;
            logger.log("video: ", val);
            return(
              <option value={ val }>
                { val }
              </option>
            );
          })
        }
      </select>
      <label>Speakers</label>
      <select name="speakers" onChange={ selectedAudioOut }>
        {
          devices.audioOut.map(dev => {
            const val = dev.label || dev.deviceId;
            return (
              <option value={ val }>
                { val }
              </option>
            );
          })
        }
      </select>
      <label>Microphone</label>
      <select name="speakers" onChange={ selectedAudioIn }>
        {
          devices.audioIn.map(dev => {
            const val = dev.label || dev.deviceId;
            return (
              <option value={ val }>
                { val }
              </option>
            );
          })
        }
      </select>
    </div>
  );
};

export default webcamSettings;