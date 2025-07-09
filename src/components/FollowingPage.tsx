import Header from './Header';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, unfollowUser } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, Timestamp } from 'firebase/firestore';

interface FollowedUser {
  userId: string;
  name: string;
  email: string;
  since: Timestamp;
}

export default function FollowingPage() {
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [following, setFollowing] = useState<FollowedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate('/');
        return;
      }
      setUser({ uid: currentUser.uid });
      // Obtener la lista de seguidos
      const ref = doc(db, 'followers', currentUser.uid);
      const snap = await getDoc(ref);
      if (!snap.exists() || !Array.isArray(snap.data().following)) {
        setFollowing([]);
        setLoading(false);
        return;
      }
      const followingIds: string[] = snap.data().following;
      // Obtener datos de cada usuario seguido
      const users: FollowedUser[] = [];
      for (const uid of followingIds) {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const d = userDoc.data();
          users.push({
            userId: uid,
            name: d.nombre || d.displayName || d.email || 'Unknown',
            email: d.email || 'Unknown',
            since: d.since || Timestamp.now(), // Si tienes la fecha real, úsala aquí
          });
        }
      }
      setFollowing(users);
      setLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  const handleUnfollow = async (targetId: string) => {
    if (!user) return;
    await unfollowUser(user.uid, targetId);
    setFollowing(f => f.filter(u => u.userId !== targetId));
  };

  return (
    <>
      <Header />
      <div style={{maxWidth:600,margin:'40px auto',background:'#fff',borderRadius:'12px',boxShadow:'0 2px 12px #0001',padding:'32px'}}>
        <h2 style={{marginBottom:'24px'}}>Following</h2>
        {loading ? <div>Loading...</div> : (
          following.length === 0 ? <div>You are not following anyone yet.</div> : (
            <div style={{display:'flex',flexDirection:'column',gap:'18px'}}>
              {following.map(u => (
                <div key={u.userId} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid #eee'}}>
                  <div>
                    <div style={{fontWeight:'bold',fontSize:'1.1em'}}>{u.name}</div>
                    <div style={{color:'#888',fontSize:'0.97em'}}>{u.email}</div>
                    <div style={{color:'#aaa',fontSize:'0.93em'}}>Since: {u.since.toDate().toLocaleDateString()}</div>
                  </div>
                  <button
                    style={{background:'#e0e0e0',color:'#1976d2',border:'none',borderRadius:'4px',padding:'6px 16px',fontWeight:500,cursor:'pointer'}}
                    onClick={() => handleUnfollow(u.userId)}
                  >
                    Following
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </>
  );
} 