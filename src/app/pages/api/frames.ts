import type { NextApiRequest, NextApiResponse } from "next";
import { readFileSync } from "fs";
import { Buffer } from "buffer";

const bitrateTable = [
  32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 512, 576
];

const samplingRateTable = [
  44100, 48000, 32000, 22050, 24000, 16000, 11025, 12000, 8000
];


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const mp3Buffer = readFileSync(req.body.file, { encoding: "binary" });
    const mp3Data = Buffer.from(mp3Buffer);

    let frameCount = 0;
    let offset = 0;


    while (offset < mp3Data.length) {
      // Check for sync word (0xFFE0 to 0xFFE7)
      if (mp3Data[offset] === 0xff && (mp3Data[offset + 1] & 0xe0) === 0xe0) {
        frameCount++;
        offset += 4;
        // Extract bitrate index, sampling rate index, and padding bit from the frame header
        const bitrateIndex = (mp3Data[offset + 2] & 0xf0) >> 4; 
        const samplingRateIndex = (mp3Data[offset + 2] & 0x0c) >> 2; 
        const paddingBit = (mp3Data[offset + 2] & 0x02) >> 1; 

        let frameLength =
          (144 * bitrateTable[bitrateIndex]) /
          (samplingRateTable[samplingRateIndex] + paddingBit);
        frameLength = Math.floor(frameLength); // Convert to integer

        // Add an extra byte if padding is present
        if (paddingBit) {
          frameLength++;
        }

        // Move to the next frame
        offset += frameLength;
      } else {
    
        throw new Error("Invalid MP3 data");
      }
    }

    // Send the JSON response with the frame count
    res.status(200).json({ frames: frameCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process MP3 file" });
  }
}
