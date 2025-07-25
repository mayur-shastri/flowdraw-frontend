import { useEffect, useState } from 'react';
import {
    Plus, Search, Filter, Grid3X3, List, User, Bell, Pen, ChevronDown,
    ArrowLeft
} from 'lucide-react';
import DropdownMenu from '../components/Dashboard/DrowdownMenu';
import DrawingCard from '../components/Dashboard/DrawingCard';
import DrawingListItem from '../components/Dashboard/DrawingListItem';
import { useNavigate } from 'react-router-dom';
import DropdownButton from '../components/Dashboard/DropdownButton';
import DropDownNotificationItem from '../components/Dashboard/DropDownNotificationItem';
import { useAuthContext } from '../contexts/AuthContext/AuthContext';
import axios from 'axios';
import { supabase } from '../utils/supabaseClient';
import { useDiagramContext } from '../contexts/DiagramContext/DiagramContext';
import { setItemLocalStorage } from '../utils/localStorage';
import { toast } from 'sonner';
import IconButton from '../components/Buttons/IconButton';

const STOCK_THUMBNAILS = [
    'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400'
];

const Dashboard = () => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [recentCollaborations, setRecentCollaborations] = useState<any[]>([]);
    const [userDrawings, setUserDrawings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const { user, handleSignOut } = useAuthContext();
    const { currentDiagramId, setCurrentDiagramIdPersistently } = useDiagramContext();
    const navigate = useNavigate();

    const handleInvitations = () => {
        navigate('/invitations');
    }

    // Mock notifications (you can fetch these from your backend if needed)
    const notifications = [
        { id: 1, title: 'Alice shared a drawing with you', time: '2m ago' },
        { id: 2, title: 'Your drawing was edited', time: '1h ago' },
        { id: 3, title: 'New comment on "Product Roadmap"', time: '3h ago' },
    ];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                toast.error(sessionError?.message || 'User not authenticated');
                setLoading(false);
                return;
            }
            const accessToken = session.access_token;
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            try {

                // User's own diagrams
                const userRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/diagrams/get-diagrams`);
                setUserDrawings(
                    (userRes.data || []).map((d: any, i: number) => ({
                        ...d,
                        thumbnail: d.thumbnail || STOCK_THUMBNAILS[i % STOCK_THUMBNAILS.length],
                    }))
                );

                // Collaborations
                const collabRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/diagrams/get-collaborations`);
                setRecentCollaborations(
                    (collabRes.data || []).map((d: any, i: number) => ({
                        ...d,
                        thumbnail: d.thumbnail || STOCK_THUMBNAILS[i % STOCK_THUMBNAILS.length],
                    }))
                );

            } catch (err: any) {
                toast.error(err.message || "Failed to fetch dashboard data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleNewDrawing = async () => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                toast.error(sessionError?.message || 'User not authenticated');
                return;
            }
            const accessToken = session.access_token;
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/diagrams/create`);
            if (response.status !== 201) {
                toast.error(response.data.message || 'Failed to create new drawing');
                return;
            }
            setCurrentDiagramIdPersistently((prev: any) => {
                setItemLocalStorage(response.data.id, []);
                return response.data.id;
            });
            toast.success(response.data.message || 'New drawing created successfully');
            navigate('/draw');
        } catch (error: any) {
            toast.error(error.message || 'Error creating new drawing');
        }
    };

    const onGoBack = () => {
        navigate('/');
    }

    useEffect(() => {
        if (currentDiagramId !== null) {
            setCurrentDiagramIdPersistently(null);
        }
    }, []);


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
            {/* Navbar */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Back Button */}
                        <div className="flex items-center space-x-4">
                            {onGoBack && (
                                <IconButton onClick={onGoBack}>
                                    <ArrowLeft className="w-5 h-5" />
                                </IconButton>
                            )}
                        </div>
                        {/* Logo */}
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Pen className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                FlowDraw
                            </span>
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-2xl mx-8">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search your drawings..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center space-x-4">
                            {/* Notifications */}
                            <div className="relative">
                                <button
                                    className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors relative"
                                    onClick={() => setShowNotificationDropdown((v) => !v)}
                                >
                                    <Bell className="w-5 h-5" />
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                                </button>
                                <DropdownMenu show={showNotificationDropdown} onClose={() => setShowNotificationDropdown(false)}>
                                    {notifications.length === 0 ? (
                                        <div className="px-4 py-2 text-slate-500">No notifications</div>
                                    ) : (
                                        notifications.map((n) => (
                                            <DropDownNotificationItem key={n.id} title={n.title} time={n.time} />
                                        ))
                                    )}
                                </DropdownMenu>
                            </div>

                            {/* Create New Drawing */}
                            <button
                                onClick={handleNewDrawing}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center">
                                <Plus className="w-4 h-4 mr-2" />
                                New Drawing
                            </button>

                            {/* User Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                                    className="flex items-center space-x-2 p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                                <DropdownMenu show={showUserDropdown} onClose={() => setShowUserDropdown(false)}>
                                    <div className="px-4 py-2 border-b border-slate-100">
                                        <span className="font-medium text-slate-800 block truncate">{(user?.user_metadata.name)}</span>
                                        <span className="block max-w-xs truncate">{user?.email}</span>
                                    </div>
                                    <DropdownButton content='Edit Profile' handleClick={() => { }} color='slate' icon='user' />
                                    <DropdownButton content='Settings' handleClick={() => { }} color='slate' icon='settings' />
                                    <DropdownButton content='Invitations' handleClick={handleInvitations} color='slate' icon='invitations' />
                                    <hr className="my-2 border-slate-100" />
                                    <DropdownButton content='Logout' handleClick={handleSignOut} color='red' icon='logout' />
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">
                        Welcome back, {user?.user_metadata?.name || "User"}!
                    </h1>
                    <p className="text-slate-600">Continue working on your designs or start something new.</p>
                </div>

                {/* Recent Collaborations */}
                {
                    recentCollaborations.length > 0 ? (
                        <section className="mb-12">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-slate-800">Recent Collaborations</h2>
                                <button className="text-indigo-600 hover:text-indigo-700 font-medium">View all</button>
                            </div>
                            {loading ? (
                                <div>Loading...</div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {recentCollaborations.map((drawing) => (
                                        <DrawingCard key={drawing.id} drawing={drawing} />
                                    ))}
                                </div>
                            )}
                        </section>) : <></>
                }

                {/* My Drawings */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-slate-800">My Drawings</h2>
                        <div className="flex items-center space-x-4">
                            {/* Filter Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                    className="flex items-center space-x-2 px-3 py-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                    <Filter className="w-4 h-4" />
                                    <span>Filter</span>
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                                <DropdownMenu show={showFilterDropdown} onClose={() => setShowFilterDropdown(false)}>
                                    <DropdownButton content="All drawings" handleClick={() => { }} color="slate" icon="layers" />
                                    <DropdownButton content="Starred" handleClick={() => { }} color="slate" icon="star" />
                                    <DropdownButton content="Recent" handleClick={() => { }} color="slate" icon="clock" />
                                    <DropdownButton content="Shared" handleClick={() => { }} color="slate" icon="share-2" />
                                </DropdownMenu>
                            </div>
                            {/* View Mode Toggle */}
                            <div className="flex items-center bg-slate-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-800'
                                        }`}
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'list'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-800'
                                        }`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Drawings Grid/List */}
                    {loading ? (
                        <div>Loading...</div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {userDrawings.map((drawing) => (
                                <DrawingCard key={drawing.id} drawing={drawing} />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {userDrawings.map((drawing) => (
                                <DrawingListItem key={drawing.id} drawing={drawing} />
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default Dashboard;