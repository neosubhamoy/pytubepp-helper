import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const execPromise = promisify(exec);

// Common configuration
const config = {
  pfxPath: 'certificate.pfx',
  pfxPassword: process.env.PFX_PASS,
  companyName: 'Subhamoy Biswas',
  companyUrl: 'https://neosubhamoy.com',
  timestampServer: 'http://timestamp.sectigo.com',
};

// Array of files to sign with their individual configurations
const filesToSign = [
  {
    path: 'src-tauri/target/release/pytubepp-helper-msghost.exe',
    programName: 'PytubePP Helper Native Messaging Host',
  },
  {
    path: 'src-tauri/target/release/pytubepp-helper-autostart.exe',
    programName: 'PytubePP Helper (Autostart)',
  },
  // Add more files as needed
];

const signFile = async (fileConfig) => {
  const { path: filePath, programName } = fileConfig;

  const command = `signtool sign /f "${config.pfxPath}" /p ${config.pfxPassword} /d "${programName}" /du "${config.companyUrl}" /n "${config.companyName}" /t ${config.timestampServer} /fd sha256 "${filePath}"`;

  try {
    const { stdout, stderr } = await execPromise(command);
    console.log(`Successfully signed ${path.basename(filePath)}`);
    console.log(stdout);
  } catch (error) {
    console.error(`Failed to sign ${path.basename(filePath)}`);
    console.error(error.message);
  }
};

const signAllFiles = async () => {
  if (!config.pfxPassword) {
    console.error('PFX password not found in environment variables.');
    return;
  }

  for (const file of filesToSign) {
    await signFile(file);
  }
  console.log('All files processed.');
};

signAllFiles();