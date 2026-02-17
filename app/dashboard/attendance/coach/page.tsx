'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { Loader2, Users, RefreshCw, Trash2, Calendar, ChevronRight, UserPlus, X, ChevronLeft, Clock } from 'lucide-react';
import { Input } from '@/components/ui/Input';

// --- Types --- 

type AttendanceSession = {
    id: string;
    code: string;
    is_active: boolean;
    created_at: string;
};

type AttendanceRecord = {
    id: string;
    status: string;
    created_at: string;
    student: {
        id: string;
        full_name: string;
    };
};

type AcademyMember = {
    user_id: string;
    user: {
        id: string;
        full_name: string;
    }
};

export default function CoachAttendancePage() {
    const { user, academy } = useAuth();

    // --- State --- 
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [isLoading, setIsLoading] = useState(true);

    // Data 
    const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
    const [pastSessions, setPastSessions] = useState<AttendanceSession[]>([]);

    // Selecting a session (for Detail View) 
    const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
    const [attendees, setAttendees] = useState<AttendanceRecord[]>([]);

    // Modals 
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [allMembers, setAllMembers] = useState<AcademyMember[]>([]);

    // --- Effects --- 

    useEffect(() => {
        if (user && academy) {
            loadInitialData();
        }
    }, [user, academy]);

    const loadInitialData = async () => {
        setIsLoading(true);
        await Promise.all([fetchActiveSession(), fetchPastSessions()]);
        setIsLoading(false);
    };

    const fetchActiveSession = async () => {
        if (!supabase) return;
        const { data } = await supabase
            .from('attendance_sessions')
            .select('*')
            .eq('created_by', user?.id)
            .eq('is_active', true)
            .maybeSingle();

        setActiveSession(data);
    };

    const fetchPastSessions = async () => {
        if (!supabase) return;
        const { data } = await supabase
            .from('attendance_sessions')
            .select('*')
            .eq('created_by', user?.id)
            .eq('is_active', false)
            .order('created_at', { ascending: false });

        if (data) setPastSessions(data);
    };

    const fetchAttendees = async (sessionId: string) => {
        if (!supabase) return;
        // setIsLoading(true); // Don't block full UI, maybe local loading 
        const { data } = await supabase
            .from('attendance_records')
            .select(` 
                id, 
                status, 
                created_at, 
                student:profiles!student_id (id, full_name) 
            `)
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false });

        if (data) {
            // Transform data to match AttendanceRecord interface
            const formattedData = data.map((record: any) => ({
                ...record,
                student: Array.isArray(record.student) ? record.student[0] : record.student
            }));
            setAttendees(formattedData);
        }
        // setIsLoading(false); 
    };

    const fetchAllMembers = async () => {
        if (!supabase || !academy) return;
        const { data } = await supabase
            .from('academy_members')
            .select(` 
                user_id, 
                user:profiles!user_id (id, full_name) 
            `)
            .eq('academy_id', academy.id);

        if (data) {
            const formattedMembers = data.map((member: any) => ({
                ...member,
                user: Array.isArray(member.user) ? member.user[0] : member.user
            }));
            setAllMembers(formattedMembers);
        }
    };

    // --- Actions --- 

    const createSession = async () => {
        if (!supabase || !user || !academy) return;
        setIsLoading(true);
        const code = Math.floor(1000 + Math.random() * 9000).toString();

        const { data, error } = await supabase
            .from('attendance_sessions')
            .insert([{
                academy_id: academy.id,
                created_by: user.id,
                code: code,
                is_active: true
            }])
            .select()
            .single();

        if (error) {
            alert(`Failed: ${error.message}`);
        } else {
            setActiveSession(data);
            // Automatically view this session ?? No, keep on Active tab 
        }
        setIsLoading(false);
    };

    const endSession = async () => {
        if (!supabase || !activeSession) return;
        if (!confirm('End this session? The code will expire.')) return;

        setIsLoading(true);
        const { error } = await supabase
            .from('attendance_sessions')
            .update({ is_active: false })
            .eq('id', activeSession.id);

        if (!error) {
            setActiveSession(null);
            fetchPastSessions();
            // If we were viewing details of the active session, close it? 
            if (selectedSession?.id === activeSession.id) setSelectedSession(null);
        }
        setIsLoading(false);
    };

    const deleteRecord = async (recordId: string) => {
        if (!supabase) return;
        if (!confirm('Remove this student?')) return;

        const { error } = await supabase
            .from('attendance_records')
            .delete()
            .eq('id', recordId);

        if (error) {
            alert('Failed to delete record');
        } else {
            setAttendees(prev => prev.filter(r => r.id !== recordId));
        }
    };

    const addStudent = async (studentId: string) => {
        if (!supabase || !selectedSession) return;

        const { data, error } = await supabase
            .from('attendance_records')
            .insert([{
                session_id: selectedSession.id,
                student_id: studentId,
                status: 'present_manual'
            }])
            .select(` 
                id, 
                status, 
                created_at, 
                student:profiles!student_id (id, full_name) 
            `)
            .single();

        if (error) {
            if (error.code === '23505') {
                alert('Student already present.');
            } else {
                alert(`Error: ${error.message}`);
            }
        } else if (data) {
            const formattedRecord = {
                ...data,
                student: Array.isArray(data.student) ? data.student[0] : data.student
            };
            // @ts-ignore
            setAttendees(prev => [formattedRecord, ...prev]);
            setIsAddingStudent(false);
        }
    };

    // --- Navigation Helpers --- 

    const openSessionDetail = (session: AttendanceSession) => {
        setSelectedSession(session);
        fetchAttendees(session.id);
    };

    const closeSessionDetail = () => {
        setSelectedSession(null);
        setAttendees([]);
    };

    // --- Render --- 

    if (isLoading && !activeSession && pastSessions.length === 0) {
        return (
            <div className="flex justify-center p-8 h-[50vh] items-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    // If a session is selected, show Detail View (Overlay/Page) 
    if (selectedSession) {
        return (
            <div className="bg-white min-h-screen pb-20">
                {/* Header */}
                <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 flex items-center gap-4 z-10">
                    <button onClick={closeSessionDetail} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
                        <ChevronLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <div className="flex-1">
                        <h2 className="font-bold text-lg leading-tight">
                            {new Date(selectedSession.created_at).toLocaleDateString()}
                        </h2>
                        <div className="flex items-center text-xs text-gray-500 gap-2">
                            <Clock className="w-3 h-3" />
                            {new Date(selectedSession.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span className="font-mono">Code: {selectedSession.code}</span>
                        </div>
                    </div>
                    {selectedSession.is_active && (
                        <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded uppercase tracking-wider">
                            Active
                        </div>
                    )}
                </div>

                {/* Stats / Actions */}
                <div className="p-4 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-800">
                        Attendees <span className="text-[var(--color-primary)]">({attendees.length})</span>
                    </h3>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => fetchAttendees(selectedSession.id)}>
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setIsAddingStudent(true); fetchAllMembers(); }}>
                            <UserPlus className="w-4 h-4 mr-1" />
                            Add
                        </Button>
                    </div>
                </div>

                {/* List */}
                <div className="divide-y divide-gray-100">
                    {attendees.map((record) => (
                        <div key={record.id} className="p-4 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center text-[var(--color-primary)] font-bold text-sm">
                                    {record.student?.full_name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">{record.student?.full_name || 'Unknown'}</div>
                                    <div className="text-xs text-gray-400">{new Date(record.created_at).toLocaleTimeString()}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => deleteRecord(record.id)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                    {attendees.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Users className="w-12 h-12 mb-3 opacity-20" />
                            <p>No attendees yet.</p>
                        </div>
                    )}
                </div>

                {/* Modal for Add Student */}
                {isAddingStudent && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="bg-white w-full max-w-md h-[80vh] sm:h-auto sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl animate-in slide-in-from-bottom">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg">Add Student</h3>
                                <button onClick={() => setIsAddingStudent(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>
                            <div className="p-4 flex-1 overflow-y-auto space-y-2">
                                {allMembers.map(member => {
                                    const isPresent = attendees.some(a => a.student.id === member.user.id);
                                    return (
                                        <button
                                            key={member.user_id}
                                            disabled={isPresent}
                                            onClick={() => addStudent(member.user.id)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl border border-transparent transition-all ${isPresent
                                                ? 'bg-green-50 text-green-700 opacity-60'
                                                : 'bg-gray-50 hover:bg-gray-100 hover:border-gray-200'
                                                }`}
                                        >
                                            <span className="font-medium">{member.user.full_name}</span>
                                            {isPresent ? <span className="text-xs font-bold">ADDED</span> : <UserPlus className="w-4 h-4 text-gray-400" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Default View (Active / History Switcher) 
    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <header className="px-6 pt-6">
                <h1 className="text-2xl font-bold text-[var(--color-dark)]">Attendance</h1>
                <p className="text-gray-500 text-sm">{academy?.name}</p>

                {/* Tabs */}
                <div className="flex p-1 bg-gray-100 rounded-xl mt-6">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'active' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'history' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        History
                    </button>
                </div>
            </header>

            <div className="px-6">
                {activeTab === 'active' ? (
                    <div className="space-y-6">
                        {/* Active Session Card */}
                        {activeSession ? (
                            <div className="bg-[var(--color-primary)] text-white rounded-3xl p-8 text-center shadow-xl shadow-green-900/10 relative overflow-hidden group hover:scale-[1.01] transition-transform cursor-pointer" onClick={() => openSessionDetail(activeSession)}>
                                <div className="relative z-10">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                        Live Now
                                    </div>
                                    <div className="text-6xl font-mono font-bold tracking-widest mb-2">
                                        {activeSession.code}
                                    </div>
                                    <p className="text-white/80 text-sm mb-6">Tap to manage attendees</p>
                                    <Button
                                        variant="secondary"
                                        fullWidth
                                        className="bg-white text-[var(--color-primary)] hover:bg-gray-100"
                                        onClick={(e) => { e.stopPropagation(); endSession(); }}
                                    >
                                        End Session
                                    </Button>
                                </div>
                                {/* Decor */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                            </div>
                        ) : (
                            <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center space-y-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400">
                                    <Users className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">No Active Session</h3>
                                    <p className="text-gray-500 text-sm">Start a session to generate a code.</p>
                                </div>
                                <Button onClick={createSession} fullWidth>
                                    Start New Session
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pastSessions.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <p>No past sessions found.</p>
                            </div>
                        ) : (
                            pastSessions.map(session => (
                                <button
                                    key={session.id}
                                    onClick={() => openSessionDetail(session)}
                                    className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 text-gray-500">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">
                                                {new Date(session.created_at).toLocaleDateString()}
                                            </h3>
                                            <p className="text-xs text-gray-500">
                                                {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300" />
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
