import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function GET() {
  try {
    const jsonPath = path.join(process.cwd(), 'data', 'songs.json');
    const content = await readFile(jsonPath, 'utf-8');

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Failed to load songs.json', error);
    return NextResponse.json({ error: 'Failed to load songs data' }, { status: 500 });
  }
}
