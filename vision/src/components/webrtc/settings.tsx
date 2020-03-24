import React, {useEffect, useState} from "react";
import {Subject} from "rxjs";

const logger = console;

interface MediaKinds {
  audioOut: MediaDeviceInfo[],
  audioIn: MediaDeviceInfo[],
  videoIn: MediaDeviceInfo[]
}

interface MediaSettingsState {
  speakerSubj: Subject<MediaDeviceInfo>;
  microphoneSubj: Subject<MediaDeviceInfo>;
  videoSubj: Subject<MediaDeviceInfo>;
}

/**
 * Functional component that handles webcam settings
 */
const webcamSettings = (props: MediaSettingsState) => {
  const kinds: MediaKinds = {
    videoIn: [],
    audioIn: [],
    audioOut: []
  };

  const [ devices, setKinds ] = useState(kinds);

  useEffect(() => {
    const getDevs = async () => {
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
  const selected = ( opt: string
    , devs: MediaDeviceInfo[]
    , subj: Subject<MediaDeviceInfo>) =>
    (evt: React.SyntheticEvent<HTMLSelectElement, Event>) => {
      logger.log(`For ${opt} you selected: `, evt.currentTarget.value);
      let dev = devs.filter(d => d.label === evt.currentTarget.value);
      if (dev.length !== 1) {
        logger.error("More than one device found with same label,");
      }
      if (dev.length === 0) {
        logger.warn("No device with label.  Trying deviceId");
        dev = devs.filter(d => d.deviceId === evt.currentTarget.value);
      }
      if (dev.length !== 1) {
        logger.error("Incorrect number of devices: ", dev);
        return;
      }
      subj.next(dev[0]);
    };
  const selectedVideo = selected("video", kinds.videoIn, props.videoSubj);
  const selectedAudioOut = selected("speakers", kinds.audioOut, props.speakerSubj);
  const selectedAudioIn = selected("microphone", kinds.audioIn, props.microphoneSubj);

  return (
    <div className="nested-menu">
      <label>Video</label>
      <select name="video" onChange={ selectedVideo }>
        {
          devices.videoIn.map((dev) => {
            const val = dev.label || dev.deviceId;
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
          devices.audioOut.map((dev) => {
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
      <select name="microphone" onChange={ selectedAudioIn }>
        {
          devices.audioIn.map((dev) => {
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