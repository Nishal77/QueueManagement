import React from 'react'

import { useNavigate } from 'react-router-dom'

const featuresList = [
    {
        title: 'Real-Time Queue Updates',
        description: 'Get live updates on your queue status and estimated waiting time.',
    },
    {
        title: 'Seamless Appointment Booking',
        description: 'Book appointments easily and receive instant confirmation.',
    },
    {
        title: 'Doctor Dashboard',
        description: 'Doctors can manage appointments and view patient queues efficiently.',
    },
    {
        title: 'Live Preview',
        description: 'Preview queue status and upcoming appointments in real time.',
    },
    {
        title: 'Mobile Friendly',
        description: 'Access the system from any device, anywhere.',
    },
]

const Features = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white py-12 px-4 relative">
            <button
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-white hover:text-black border border-black transition-all duration-300"
            >
                Back to Landing Page
            </button>
            <h1 className="text-4xl font-bold mb-8 text-center">Features</h1>
            <div className="max-w-3xl mx-auto grid gap-8">
                {featuresList.map((feature, idx) => (
                    <div
                        key={idx}
                        className="bg-gray-100 rounded-xl p-6 shadow hover:bg-black hover:text-white transition-all duration-300"
                    >
                        <h2 className="text-2xl font-semibold mb-2">{feature.title}</h2>
                        <p className="text-lg">{feature.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Features