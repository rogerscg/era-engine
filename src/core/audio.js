import DEFAULT_SETTINGS from '../data/settings.js';
import SOUND_DATA from '../data/sounds.js';
import EngineResetEvent from '../events/engine_reset_event.js';
import Settings from './settings.js';
import SettingsEvent from '../events/settings_event.js';
import {createUUID, shuffleArray} from './util.js';

const CROSSFADE_TIME = 500;

/** 
 * Core implementation for all audio. Manages the loading, playback, and
 * other controls needed for in-game audio.
 */
let audioInstance = null;

class Audio {

  /**
   * Enforces a singleton audio instance.
   */
  static get() {
    if (!audioInstance) {
      audioInstance = new Audio();
    }
    return audioInstance;
  }

  constructor() {
    this.context = new AudioContext();

    // Map containing all sounds used in the engine. Key is the sound name,
    // value is the sound buffer.
    this.sounds = new Map();

    // The ambient sounds loaded.
    this.backgroundSounds = new Array();
    this.ambientEventSounds = new Array();
    
    // A map of playing sounds in order to allow stopping mid-play.
    this.playingSounds = new Map();

    this.loadSettings();
    SettingsEvent.listen(this.loadSettings.bind(this));
    EngineResetEvent.listen(this.handleEngineReset.bind(this));
  }

  /**
   * Loads all sounds specified in the sound data file.
   */
  loadSounds() {
    const promises = [];
    for (let name in SOUND_DATA) {
      const soundData = SOUND_DATA[name];
      promises.push(this.loadSound(soundData.name, soundData.extension));
    }
    return Promise.all(promises).then((sounds) => {
      sounds.forEach((sound) => this.sounds.set(sound.name, sound.buffer));
    });
  }

  /**
   * Loads an individual sound.
   */
  loadSound(name, extension) {
    const path = `assets/sounds/${name}.${extension}`;
    return this.createSoundRequest(path).then((event) => {
      return this.bufferSound(event);
    }).then((buffer) => {
      return Promise.resolve({
        name,
        buffer
      });
    });
  }
  
   /**
   * Creates and sends an HTTP GET request with type arraybuffer for sound.
   */
  createSoundRequest(path) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open('GET', path, true);
      request.responseType = 'arraybuffer';
      request.addEventListener('load', (event) => {
        resolve(event);
      }, false);
      request.send();
    });
  }

  /**
   * Decodes audio data from the request response.
   */
  bufferSound(event) {
    return new Promise((resolve, reject) => {
      const request = event.target;
      this.context.decodeAudioData(request.response, (buffer) => {
        resolve(buffer);
      });
    });
  }

  /**
   * Converts an audio buffer into a Web Audio API source node.
   */
  createSourceNode(buffer) {
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(this.context.destination);
    return {
      source: source,
      gain: gain
    };
  }

  /**
   * Plays a sound in-game.
   */
  playSound(name, adjustVolume = 1.0) {
    const defaultSound = this.sounds.get(name);
    let buffer = defaultSound;
    if (!buffer) {
      return false;
    }
    const soundData = SOUND_DATA[name];
    const source = this.createSourceNode(buffer);
    const volRatio = this.masterVolume / this.defaultVolume;
    const dataVolume = soundData && soundData.volume ? soundData.volume : 1.0;
    const volume = volRatio * dataVolume * adjustVolume;
    source.gain.gain.value = volume;
    source.source.start(0);
    return source;
  }

  /** 
   * Stops playing a sound.
   */
  stopSound(sourceNode) {
    if (sourceNode) {
      sourceNode.source.stop();
    }
  }

  /**
   * Loads settings relevant to audio.
   */
  loadSettings() {
    this.masterVolume = Settings.get('volume');
    this.defaultVolume = DEFAULT_SETTINGS.volume;
  }

  /**
   * Starts the loaded ambient sound track.
   */
  startAmbientSound() {
    if (!this.backgroundSounds.length) {
      return;
    }
    this.shouldPlayAmbientSound = true;
    this.addAmbientTrack(0, this.backgroundSounds, this.ambientVolume);
    setTimeout(() => {
      this.addAmbientTrack(1, this.backgroundSounds, this.ambientVolume);
    }, 2500);
    if (this.ambientEventSounds.length) {
      this.addAmbientTrack(2, this.ambientEventSounds, .2, .2);
    }
  }

  /**
   * Stops playing ambient sound track.
   */
  stopAmbientSound() {
    this.shouldPlayAmbientSound = false;
    this.playingSounds.forEach((node) => {
      node.source.stop();
    });
    this.playingSounds.clear();
  }

  /**
   * Adds an ambient track to the specific channel. Called each time a new audio
   * clip needs to be played to continue the ambient noises.
   */
  addAmbientTrack(channel, sources, sourceVolume, randomness = 1.0) {
    if (!this.shouldPlayAmbientSound) {
      return;
    }
    // Add a randomness play factor for varied background noises. This is
    // optional, as the default randomness of 1.0 will never trigger this.
    if (Math.random() > randomness) {
      setTimeout(() => {
        this.addAmbientTrack(channel, sources, sourceVolume, randomness);
      }, 3000);
      return;
    }
    const volRatio = this.masterVolume / this.defaultVolume;
    const volume = volRatio * sourceVolume;
    shuffleArray(sources);
    let selectedBuffer = null;
    for (let source of sources) {
      if (!source.inUse) {
        selectedBuffer = source;
        break;
      }
    }
    if (!selectedBuffer) {
      return;
    }
    selectedBuffer.inUse = true;
    let currTime = this.context.currentTime;
    const node = this.createSourceNode(selectedBuffer);
    const uuid = createUUID();
    this.playingSounds.set(uuid, node);
    node.source.start(0);
    node.gain.gain.linearRampToValueAtTime(0, currTime);
    node.gain.gain.linearRampToValueAtTime(
      volume, currTime + CROSSFADE_TIME / 1000);

    // When the audio track is drawing to a close, queue up new track, fade old.
    setTimeout(() => {
      this.addAmbientTrack(channel, sources, sourceVolume, randomness);
      currTime = this.context.currentTime
      node.gain.gain.linearRampToValueAtTime(volume, currTime);
      node.gain.gain.linearRampToValueAtTime(
        0, currTime + CROSSFADE_TIME / 1000);
    }, Math.round(node.source.buffer.duration * 1000 - CROSSFADE_TIME));

    // When audio finishes playing, mark as not in use.
    setTimeout(() => {
      selectedBuffer.inUse = false;
      this.playingSounds.delete(uuid);
    }, Math.round(node.source.buffer.duration * 1000));
  }

  /**
   * Handles an engine reset event.
   */
  handleEngineReset() {
    this.stopAmbientSound();
  }
}

export default Audio;
