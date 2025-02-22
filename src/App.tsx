import React, { useState, useEffect } from 'react';
import { Calendar, Clock, LineChart, MapPin, Plus, Save, Trash2, LogIn, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';

interface TrainingRecord {
  id: string;
  date: string;
  distance: number;
  duration: string;
  pace: string;
  location: string;
  notes: string;
}

function App() {
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    distance: '',
    duration: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchRecords();
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchRecords();
      } else {
        setRecords([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('training_records')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching records:', error);
    } else {
      setRecords(data || []);
    }
  };

  const calculatePace = (distance: number, duration: string): string => {
    const [hours, minutes] = duration.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const paceMinutes = totalMinutes / distance;
    const paceMin = Math.floor(paceMinutes);
    const paceSec = Math.round((paceMinutes - paceMin) * 60);
    return `${paceMin}:${paceSec.toString().padStart(2, '0')}/km`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;

    const newRecord = {
      user_id: session.user.id,
      date: formData.date,
      distance: Number(formData.distance),
      duration: formData.duration,
      pace: calculatePace(Number(formData.distance), formData.duration),
      location: formData.location,
      notes: formData.notes,
    };

    const { error } = await supabase
      .from('training_records')
      .insert([newRecord]);

    if (error) {
      console.error('Error inserting record:', error);
    } else {
      fetchRecords();
      setShowForm(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        distance: '',
        duration: '',
        location: '',
        notes: '',
      });
    }
  };

  const deleteRecord = async (id: string) => {
    const { error } = await supabase
      .from('training_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting record:', error);
    } else {
      fetchRecords();
    }
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: prompt('メールアドレスを入力してください') || '',
      password: prompt('パスワードを入力してください') || '',
    });
    if (error) console.error('Error logging in:', error);
  };

  const handleSignUp = async () => {
    const email = prompt('メールアドレスを入力してください');
    const password = prompt('パスワードを入力してください');
    if (!email || !password) return;

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      console.error('Error signing up:', error);
    } else {
      alert('登録確認メールを送信しました。メールを確認してください。');
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">マラソントレーニング記録</h1>
          <div>
            {!session ? (
              <div className="space-x-4">
                <button
                  onClick={handleLogin}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-50 transition-colors"
                >
                  <LogIn size={20} />
                  ログイン
                </button>
                <button
                  onClick={handleSignUp}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-400 transition-colors"
                >
                  新規登録
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-400 transition-colors"
              >
                <LogOut size={20} />
                ログアウト
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {session ? (
          <>
            <button
              onClick={() => setShowForm(!showForm)}
              className="mb-8 bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              新規記録
            </button>

            {showForm && (
              <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
                <h2 className="text-xl font-semibold mb-4">トレーニング記録を追加</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">距離 (km)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.distance}
                        onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">時間 (HH:MM)</label>
                      <input
                        type="text"
                        pattern="[0-9]{1,2}:[0-9]{2}"
                        placeholder="1:30"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">場所</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Save size={20} />
                      保存
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          日付
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          <LineChart size={16} />
                          距離  
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          時間
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ペース
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          <MapPin size={16} />
                          場所
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        メモ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">{record.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{record.distance} km</td>
                        <td className="px-6 py-4 whitespace-nowrap">{record.duration}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{record.pace}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{record.location}</td>
                        <td className="px-6 py-4">{record.notes}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => deleteRecord(record.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {records.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          記録がありません
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">
              ログインしてトレーニング記録を管理しましょう
            </h2>
            <p className="text-gray-600">
              記録を保存するには、ログインまたは新規登録が必要です。
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;