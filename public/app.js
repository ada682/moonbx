const { useState, useEffect } = React;

function CaptchaSolver() {
    const [activeTab, setActiveTab] = useState('slide');
    const [captchaData, setCaptchaData] = useState(null);
    const [sliderValue, setSliderValue] = useState(0);
    const [bcaptchaSolution, setBcaptchaSolution] = useState('');
    const [status, setStatus] = useState('Waiting for captcha...');
    const socket = io();

    useEffect(() => {
        socket.on('newCaptcha', (data) => {
            setCaptchaData(data);
            setStatus(`New ${data.type} captcha received`);
            setActiveTab(data.type);
        });

        socket.on('captchaTimeout', () => {
            setCaptchaData(null);
            setStatus('Captcha timed out');
        });

        return () => {
            socket.off('newCaptcha');
            socket.off('captchaTimeout');
        };
    }, []);

    const handleSubmit = () => {
        if (!captchaData) {
            setStatus('No active captcha');
            return;
        }

        const solution = activeTab === 'slide' ? sliderValue.toString() : bcaptchaSolution;
        socket.emit('captchaSolved', {
            sessionId: captchaData.sessionId,
            solution,
            type: captchaData.type
        });
        setStatus('Solution submitted');
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
                <div className="p-8">
                    <h1 className="text-2xl font-bold text-center mb-4">Manual Captcha Solver</h1>
                    
                    <div className="flex mb-4">
                        <button 
                            className={`flex-1 py-2 ${activeTab === 'slide' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                            onClick={() => setActiveTab('slide')}
                        >
                            Slide Captcha
                        </button>
                        <button 
                            className={`flex-1 py-2 ${activeTab === 'bcaptcha2' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                            onClick={() => setActiveTab('bcaptcha2')}
                        >
                            BCaptcha2
                        </button>
                    </div>

                    {captchaData && (
                        <div>
                            {activeTab === 'slide' && (
                                <div>
                                    {captchaData.captchaImage && (
                                        <img 
                                            src={captchaData.captchaImage} 
                                            alt="Captcha" 
                                            className="w-full mb-4"
                                        />
                                    )}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Slide position: {sliderValue}
                                        </label>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="400" 
                                            value={sliderValue}
                                            onChange={(e) => setSliderValue(parseInt(e.target.value))}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'bcaptcha2' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">
                                        BCaptcha2 Solution
                                    </label>
                                    <input 
                                        type="text"
                                        value={bcaptchaSolution}
                                        onChange={(e) => setBcaptchaSolution(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        placeholder="Enter solution"
                                    />
                                </div>
                            )}

                            <button 
                                onClick={handleSubmit}
                                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                            >
                                Submit Solution
                            </button>
                        </div>
                    )}

                    <div className="mt-4 text-center text-sm text-gray-500">
                        {status}
                    </div>
                </div>
            </div>
        </div>
    );
}

ReactDOM.render(<CaptchaSolver />, document.getElementById('root'));