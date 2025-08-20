import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DataDebugger = () => {
  const [debugData, setDebugData] = useState({})
  const [loading, setLoading] = useState(false)

  const testDatabaseConnection = async () => {
    setLoading(true)
    try {
      console.log('🧪 Testing database connection...')
      
      // Test 1: Check tables exist
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['doctors', 'patients', 'appointments'])
      
      if (tablesError) {
        console.error('❌ Error checking tables:', tablesError)
      } else {
        console.log('✅ Available tables:', tables)
      }
      
      // Test 2: Check doctors
      const { data: doctors, error: doctorsError } = await supabase
        .from('doctors')
        .select('*')
        .limit(3)
      
      if (doctorsError) {
        console.error('❌ Error fetching doctors:', doctorsError)
      } else {
        console.log('✅ Doctors data:', doctors)
        setDebugData(prev => ({ ...prev, doctors }))
      }
      
      // Test 3: Check patients
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .limit(3)
      
      if (patientsError) {
        console.error('❌ Error fetching patients:', patientsError)
      } else {
        console.log('✅ Patients data:', patients)
        setDebugData(prev => ({ ...prev, patients }))
      }
      
      // Test 4: Check appointments with joins
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          queue_number,
          time_slot,
          status,
          patients(
            name,
            gender,
            phone_number
          ),
          doctors(
            name,
            specialization
          )
        `)
        .limit(3)
      
      if (appointmentsError) {
        console.error('❌ Error fetching appointments:', appointmentsError)
      } else {
        console.log('✅ Appointments data:', appointments)
        setDebugData(prev => ({ ...prev, appointments }))
      }
      
    } catch (error) {
      console.error('❌ Error in database test:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black border border-gray-600 rounded-lg p-4 max-w-md max-h-96 overflow-auto z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold">🔍 Data Debugger</h3>
        <button
          onClick={testDatabaseConnection}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test DB'}
        </button>
      </div>
      
      <div className="space-y-3 text-xs">
        <div>
          <h4 className="text-green-400 font-semibold">Doctors ({debugData.doctors?.length || 0})</h4>
          <pre className="text-white bg-gray-800 p-2 rounded overflow-auto max-h-20">
            {JSON.stringify(debugData.doctors, null, 2)}
          </pre>
        </div>
        
        <div>
          <h4 className="text-blue-400 font-semibold">Patients ({debugData.patients?.length || 0})</h4>
          <pre className="text-white bg-gray-800 p-2 rounded overflow-auto max-h-20">
            {JSON.stringify(debugData.patients, null, 2)}
          </pre>
        </div>
        
        <div>
          <h4 className="text-yellow-400 font-semibold">Appointments ({debugData.appointments?.length || 0})</h4>
          <pre className="text-white bg-gray-800 p-2 rounded overflow-auto max-h-20">
            {JSON.stringify(debugData.appointments, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default DataDebugger
