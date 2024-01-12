import express from 'express';
import next from 'next';
import cors from 'cors';
import multer from 'multer';


const bitrateTable = [32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384];
const samplingRateTable = [44100, 48000, 32000];



const app = next({ dev: process.env.NODE_ENV !== 'production' });
const handle = app.getRequestHandler();
const expressApp = express();

const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

expressApp.use(cors({
    origin: 'http://localhost:3000', // Allow requests from frontend port
}));

expressApp.post('/api/frames',  upload.single('file'), async (req, res) => {
    try {
      const mp3Data = req.file.buffer;

      let offset = 0;

      // Check for an ID3 tag
      const id3TagIdentifier = 'ID3';

      // Check for ID3v2 tag
      if (mp3Data.slice(0, 3).toString() === id3TagIdentifier) {
          // Extract ID3v2 tag size from the header
          const id3TagSize =
              ((mp3Data[6] & 0x7F) << 21) |
              ((mp3Data[7] & 0x7F) << 14) |
              ((mp3Data[8] & 0x7F) << 7) |
              (mp3Data[9] & 0x7F);
      
          // Skip over the ID3v2 tag
          offset = id3TagSize + id3TagIdentifier.length;
      
      }
      

      let frameCount = 0;
      const frameSize = 4;

     
      while (offset < mp3Data.length) {
        // Search for MP3 frame sync (0xFFE0 to 0xFFE7)
        while (offset < mp3Data.length - 1 && (mp3Data[offset] !== 0xFF || (mp3Data[offset + 1] & 0xE0) !== 0xE0)) {
            offset++;
        }
    
        if (offset >= mp3Data.length - 1) {
            // No more sync words found, exit the loop
            break;
        }
    
    
        frameCount++;
        offset += 4;
    
        if (offset + 4 > mp3Data.length) {
            // Insufficient data for a complete frame, exit the loop
            break;
        }
    
        const headerBytes = mp3Data.slice(offset - 4, offset);
    
        console.log(`Header Bytes: ${headerBytes.toString('hex')}`);
    
        const syncBits = ((headerBytes[0] << 4) | (headerBytes[1] >>> 4)) & 0x0FFF;
        const bitrateIndex = (headerBytes[2] & 0xF0) >>> 4;
        const samplingRateIndex = (headerBytes[2] & 0x0F) >>> 2 | ((headerBytes[1] & 0x0003) << 2);
        const paddingBit = (headerBytes[1] & 0x0002) >>> 1;
    
        console.log(`Sync Bits: ${syncBits.toString(16)}`);
        console.log(`Bitrate Index: ${bitrateIndex}`);
        console.log(`Sampling Rate Index: ${samplingRateIndex}`);
        console.log(`Padding Bit: ${paddingBit}`);
    
        if (bitrateIndex >= 0 && bitrateIndex < bitrateTable.length && samplingRateIndex >= 0 && samplingRateIndex < samplingRateTable.length) {
            // Valid indices, proceed with frame length extraction
            const frameLengthBytes = mp3Data.slice(offset, offset + 4);
            const frameLength = ((frameLengthBytes[1] & 0x000000FF) << 16) | (frameLengthBytes[2] << 8) | frameLengthBytes[3];
    
            console.log(`Frame Length: ${frameLength}`);
    
            // Move to the next potential frame
            offset += frameLength;
        } 
    }
      // Send the JSON response with the frame count
      console.log(frameCount)
        res.status(200).json({ frames: frameCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process MP3 file' });
    }
});

app.prepare().then(() => {
    expressApp.all('*', (req, res) => {
        return handle(req, res); // Handle other routes using Next.js
    });

    expressApp.listen(8080, (err) => {
        if (err) throw err;
        console.log('> Ready on http://localhost:8080');
    });
});