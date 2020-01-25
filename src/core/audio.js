/**
 * @author rogerscg / https://github.com/rogerscg
 */
import Plugin from './plugin.js';
import Settings from './settings.js';
import SettingsEvent from '../events/settings_event.js';
import {createUUID, loadJsonFromFile, shuffleArray} from './util.js';

const CROSSFADE_TIME = 500;

let instance = null;

/** 
 * Core implementation for all audio. Manages the loading, playback, and
 * other controls needed for in-game audio.
 */
class Audio extends Plugin {
  static get() {
    if (!instance) {
      instance = new Audio();
    }
    return instance;
  }

  constructor() {
    super();
    this.defaultVolume = 50;

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
  }

  /** @override */
  reset() {
    this.stopAmbientSound();
    this.playingSounds.forEach((node) => node.source.stop());
    this.playingSounds.clear();
  }

  /** @override */
  update() {}

  /**
   * Loads all sounds described from the provided file path. The file should
   * be a JSON file. Follow the example at /src/data/sounds.json.
   * @param {string} filePath
   * @async
   */
  async loadAllFromFile(filePath) {
    if (!filePath) {
      return;
    }
    // Load JSON file with all sounds and options.
    let allSoundData;
    try {
      allSoundData = await loadJsonFromFile(filePath);
    } catch (e) {
      throw new Error(e);
    }
    // Extract the directory from the file path, use for loading sounds.
    const directory = filePath.substr(0, filePath.lastIndexOf('/') + 1);
    const promises = new Array();
    for (let name in allSoundData) {
      const options = allSoundData[name];
      promises.push(this.loadSound(directory, name, options));
    }
    return Promise.all(promises);
  }

  /**
   * Loads an individual sound and stores it.
   * @param {string} directory
   * @param {string} name
   * @param {Object} options
   */
  async loadSound(directory, name, options) {
    let extension = options.extension;
    // Insert a period if the extension doesn't have one.
    if (!extension.startsWith('.')) {
      extension = '.' + extension;
    }
    const path = `${directory}${name}${extension}`;
    const event = await this.createSoundRequest(path);
    const buffer = await this.bufferSound(event);
    this.sounds.set(name, buffer)
    return;
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
    return new Promise((resolve) => {
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
    const node = this.createSourceNode(buffer);
    const volRatio = this.masterVolume / this.defaultVolume;
    // TODO: Load sounds into actual sound objects.
    const dataVolume = 1.0; //soundData && soundData.volume ? soundData.volume : 1.0;
    const volume = volRatio * dataVolume * adjustVolume;
    node.gain.gain.value = volume;
    node.source.start(0);
    node.uuid = createUUID();
    this.playingSounds.set(node.uuid, node);
    setTimeout(() => {
      this.playingSounds.delete(node.uuid);
    }, Math.round(node.source.buffer.duration * 1000));
    return node;
  }

  /**
   * Plays a sound in-game on a loop.
   */
  playSoundOnLoop(name, adjustVolume = 1.0) {
    const defaultSound = this.sounds.get(name);
    let buffer = defaultSound;
    if (!buffer) {
      return false;
    }
    const node = this.createSourceNode(buffer);
    const volRatio = this.masterVolume / this.defaultVolume;
    // TODO: Load sounds into actual sound objects.
    const dataVolume = 1.0; //soundData && soundData.volume ? soundData.volume : 1.0;
    const volume = volRatio * dataVolume * adjustVolume;
    node.gain.gain.value = volume;
    node.source.loop = true;
    node.source.start(0);
    node.uuid = createUUID();
    this.playingSounds.set(node.uuid, node);
    return node;
  }

  /** 
   * Stops playing a sound.
   */
  stopSound(sourceNode) {
    if (sourceNode) {
      sourceNode.source.stop();
      if (sourceNode.uuid) {
        this.playingSounds.delete(sourceNode.uuid);
      }
    }
  }

  /**
   * Loads settings relevant to audio.
   */
  loadSettings() {
    this.masterVolume = Settings.get('volume');
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
    const uuid = createUUID();
    this.playingSounds.set(uuid, node);
    setTimeout(() => {
      selectedBuffer.inUse = false;
      this.playingSounds.delete(uuid);
    }, Math.round(node.source.buffer.duration * 1000));
  }
}

export default Audio;
