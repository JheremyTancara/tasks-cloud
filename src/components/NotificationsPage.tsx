import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import Header from './Header';

interface Notification {
  id: string;
  postId: string;
  postTitle: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  read: boolean;
}

export default function NotificationsPage() {
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [deletedPosts, setDeletedPosts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate('/');
        return;
      }
      setUser({ uid: currentUser.uid });
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    const notifRef = collection(db, 'users', user.uid, 'notifications');
    const unsub = onSnapshot(notifRef, async snap => {
      const notifs = snap.docs.map(docu => ({ id: docu.id, ...docu.data() })) as Notification[];
      setNotifications(notifs.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
      setLoading(false);
      // Marcar como leídas
      notifs.forEach(n => {
        if (!n.read) updateDoc(doc(db, 'users', user.uid, 'notifications', n.id), { read: true });
      });
      // Verificar si los posts existen
      const deleted: Record<string, boolean> = {};
      await Promise.all(notifs.map(async n => {
        if (n.postId) {
          const postDoc = await getDoc(doc(db, 'posts', n.postId));
          if (!postDoc.exists()) deleted[n.postId] = true;
        }
      }));
      setDeletedPosts(deleted);
    });
    return () => unsub();
  }, [user]);

  return (
    <>
      <Header />
      <div style={{maxWidth:600,margin:'40px auto',background:'#fff',borderRadius:'12px',boxShadow:'0 2px 12px #0001',padding:'32px'}}>
        <h2 style={{marginBottom:'24px'}}>Notifications</h2>
        {loading ? <div>Loading...</div> : (
          notifications.length === 0 ? <div>You have no notifications yet.</div> : (
            <div style={{display:'flex',flexDirection:'column',gap:'18px'}}>
              {notifications.map(n => (
                <div key={n.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid #eee',background:n.read?'#f7f7f7':'#eaf6ff'}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:'bold',fontSize:'1.08em',color:'#1976d2'}}>{n.authorName}</div>
                    <div style={{color:'#222',fontSize:'1em'}}>published: <span style={{fontWeight:500}}>{n.postTitle}</span></div>
                    <div style={{color:'#888',fontSize:'0.93em'}}>{n.createdAt?.toDate?.().toLocaleString?.() || ''}</div>
                  </div>
                  {deletedPosts[n.postId] ? (
                    <button style={{background:'#EB3E73',color:'#fff',border:'none',borderRadius:'4px',padding:'6px 12px',fontWeight:500,cursor:'not-allowed',marginLeft:'18px'}} disabled>
                      Post deleted
                    </button>
                  ) : (
                    <button
                      style={{background:'#1877f2',color:'#fff',border:'none',borderRadius:'4px',padding:'6px 12px',fontWeight:500,cursor:'pointer',marginLeft:'18px'}}
                      onClick={()=>navigate(`/posts/${n.postId}`)}
                    >
                      View Post
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </>
  );
} 