import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.christmaslunch.app',
  appName: 'Christmas Lunch',
  webDir: 'www',
  android: {
    allowMixedContent: true
  }
};

export default config;
