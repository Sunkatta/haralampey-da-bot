
import { EndBehaviorType, VoiceReceiver } from '@discordjs/voice';
import { OpusEncoder } from '@discordjs/opus';
import { User } from 'discord.js';

import {
    createWriteStream,
    promises as fs,
} from 'node:fs';

import { Transform, pipeline } from 'node:stream';

const SAMPLE_RATE = 48_000;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;

function getDisplayName(user: User) {
    return (user.username ?? user?.id).replace(/[^a-zA-Z0-9_-]/g, '_');
}

// Creates a standard 44-byte PCM WAV header.
function createWavHeader(dataSize: number): Buffer {
    const header = Buffer.alloc(44);

    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);

    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); // PCM format
    header.writeUInt16LE(CHANNELS, 22);
    header.writeUInt32LE(SAMPLE_RATE, 24);

    const byteRate = SAMPLE_RATE * CHANNELS * BITS_PER_SAMPLE / 8;

    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(CHANNELS * BITS_PER_SAMPLE / 8, 32);
    header.writeUInt16LE(BITS_PER_SAMPLE, 34);

    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return header;
}

export function createListeningStream(
    receiver: VoiceReceiver,
    user: User,
) {
    const opusStream = receiver.subscribe(user.id, {
        end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 1000,
        },
    });

    // @discordjs/opus exposes decoding through OpusEncoder.
    const decoder = new OpusEncoder(SAMPLE_RATE, 2);

    // Convert incoming Opus packets into mono PCM.
    const pcmStream = new Transform({
        transform(packet, _encoding, callback) {
            try {
                // Support both older Buffer packets and newer AudioPacket objects.
                const opusPacket = Buffer.isBuffer(packet)
                    ? packet
                    : packet.payload;

                const stereoPcm = decoder.decode(opusPacket);

                // Downmix stereo signed 16-bit PCM to mono.
                const samples = stereoPcm.length / 4;
                const monoPcm = Buffer.allocUnsafe(samples * 2);

                for (let i = 0; i < samples; i++) {
                    const left = stereoPcm.readInt16LE(i * 4);
                    const right = stereoPcm.readInt16LE(i * 4 + 2);

                    monoPcm.writeInt16LE(
                        Math.round((left + right) / 2),
                        i * 2,
                    );
                }

                callback(null, monoPcm);
            } catch (error) {
                callback(error as Error);
            }
        },
    });

    const filename = `./recordings/${Date.now()}-${getDisplayName(user)}.wav`;

    const out = createWriteStream(filename);

    // Reserve space for the WAV header.
    out.write(createWavHeader(0));

    console.log(`👂 Started recording ${filename}`);

    pipeline(opusStream, pcmStream, out, async (err) => {
        if (err) {
            console.warn(
                `❌ Error recording ${filename}: ${err.message}`,
            );
            return;
        }

        try {
            const handle = await fs.open(filename, 'r+');

            try {
                const stats = await handle.stat();
                await handle.write(createWavHeader(stats.size - 44), 0);
            } finally {
                await handle.close();
            }

            console.log(`✅ Recorded ${filename}`);
        } catch (error) {
            console.warn(`❌ Failed to finalize WAV: ${error}`);
        }
    });
}
