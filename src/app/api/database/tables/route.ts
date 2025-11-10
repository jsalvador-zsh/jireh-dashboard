// API Route para inspeccionar las tablas de la base de datos

import { NextResponse } from 'next/server';
import dbClient from '@/lib/db-client';

export async function GET() {
  try {
    const tables = await dbClient.getTables();

    // Obtener estructura de cada tabla
    const tablesWithStructure = await Promise.all(
      tables.map(async (tableName) => {
        const structure = await dbClient.getTableStructure(tableName);
        return {
          name: tableName,
          columns: structure,
        };
      })
    );

    return NextResponse.json({
      tables: tablesWithStructure,
      count: tables.length,
    });
  } catch (error) {
    console.error('Error fetching database tables:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch database tables',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
