import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, onSnapshot, deleteDoc, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/ManagementPage.css';
import { FaRegUserCircle, FaTrashAlt } from 'react-icons/fa';

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + '...' : text;
}

const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Público', icon: '🌐' },
  { value: 'private', label: 'Solo yo', icon: '🔒' },
  { value: 'friends', label: 'Amigos', icon: '👥' },
];

function PrivacySelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = PRIVACY_OPTIONS.find(opt => opt.value === value) || PRIVACY_OPTIONS[0];
  return (
    <div className="privacy-selector" tabIndex={0} onBlur={()=>setOpen(false)}>
      <span className="privacy-icon-large" title={current.label} onClick={()=>setOpen(v=>!v)}>{current.icon}</span>
      {open && (
        <div className="privacy-menu">
          {PRIVACY_OPTIONS.map(opt => (
            <div key={opt.value} className="privacy-menu-item" onClick={()=>{onChange(opt.value);setOpen(false);}}>
              <span className="privacy-icon-large">{opt.icon}</span> {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };
  const links = [
    { to: '/home', label: 'Home' },
    { to: '#', label: 'About' },
    { to: '/posts', label: 'Posts' },
    { to: '/management', label: 'Management' },
    { to: '/profile', label: 'Profile' },
  ];
  return (
    <nav className="navbar">
      <div className="navbar-brand">Jalasoft</div>
      <div className="navbar-nav">
        {links.map(link => (
          <a
            key={link.to}
            href={link.to}
            className={`nav-link${location.pathname.startsWith(link.to.replace('#','')) && link.to !== '#' ? ' nav-link-active' : ''}`}
          >
            {link.label}
          </a>
        ))}
      </div>
      <button onClick={handleLogout} className="logout-button">Sign Out</button>
    </nav>
  );
}

export default function ManagementPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', imageUrl: '' });
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) navigate('/');
      else setUser(currentUser);
    });
    return () => { unsubscribeAuth(); };
  }, [navigate]);

  useEffect(() => {
    let unsubscribePosts = () => {};
    if (user) {
      const q = query(collection(db, 'posts'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      unsubscribePosts = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('USER UID:', user.uid);
        console.log('POSTS FROM FIRESTORE:', docs);
        setPosts(docs);
      });
    } else {
      setPosts([]);
    }
    return () => { unsubscribePosts(); };
  }, [user]);

  const handleDelete = async (postId: string) => {
    await deleteDoc(doc(db, 'posts', postId));
  };

  const handleEdit = (post: any) => {
    setEditingId(post.id);
    setEditForm({ title: post.title, description: post.description, imageUrl: post.imageUrl || '' });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    await updateDoc(doc(db, 'posts', editingId), {
      title: editForm.title,
      description: editForm.description,
      imageUrl: editForm.imageUrl,
      updatedAt: new Date()
    });
    setEditingId(null);
    setEditForm({ title: '', description: '', imageUrl: '' });
  };

  return (
    <div className="management-page-compact">
      <Header />
      <h2 style={{fontSize:'2.3rem',margin:'48px 0 32px 0',textAlign:'center'}}>Mis Jala Posts</h2>
      <div className="management-list-compact">
        {posts.length === 0 ? (
          <div style={{textAlign:'center',color:'#888',marginTop:'48px',fontSize:'1.2rem'}}>No tienes posts aún.</div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="management-card-compact" onClick={() => setSelectedPost(post)} style={{cursor:'pointer',display:'flex',alignItems:'center',gap:'24px',minHeight:'70px', width:'600px', marginLeft:'-7rem',padding:'16px',backgroundColor:'#fff',borderRadius:'8px',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
              <div style={{flexShrink:0,display:'flex',alignItems:'center'}}>
                <FaRegUserCircle style={{fontSize:'5rem', marginLeft:'-18rem', marginTop:'-0.3rem', color:'#1877f2',display:'block'}} />
              </div>
              <div style={{display:'flex',flexDirection:'column',justifyContent:'center',marginTop:'-6.7rem', marginLeft:'-14rem', alignItems:'flex-start',flex:1,paddingLeft:'16px'}}>
                <div style={{fontWeight:700,fontSize:'1.3rem',color:'#1877f2',marginBottom:'6px',lineHeight:'1.3'}}>{post.title}</div>
                <div style={{fontSize:'1rem',color:'#666',marginBottom:'6px',lineHeight:'1.4'}}>{truncate(post.description, 60)}</div>
                <div style={{fontSize:'0.9rem',color:'#888',lineHeight:'1.2'}}>{post.createdAt?.toDate?.().toLocaleString?.() || ''}</div>
              </div>
            </div>
          ))
        )}
      </div>
      {selectedPost && (
        <div className="create-post-modal" onClick={()=>setSelectedPost(null)}>
          <div className="create-post-content" style={{minWidth:'340px',maxWidth:'95vw'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
              <FaRegUserCircle style={{fontSize:'2.1rem',color:'#1877f2'}} />
              <span style={{fontWeight:600}}>{selectedPost.userName}</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <h3 className="post-title" style={{margin:0}}>{selectedPost.title}</h3>
              <span className="privacy-icon-large" title={selectedPost.privacy}>{selectedPost.privacy === 'public' ? '🌐' : selectedPost.privacy === 'private' ? '🔒' : '👥'}</span>
            </div>
            <p className="post-description">{selectedPost.description}</p>
            {selectedPost.imageUrl && <img src={selectedPost.imageUrl} alt="Post" className="post-image-centered" />}
            <div className="post-meta-centered">
              <span>{selectedPost.createdAt?.toDate?.().toLocaleString?.() || ''}</span>
            </div>
            <div className="post-actions-centered">
              <span className="like-icon" title="Likes">👍</span>
              <span className="like-count">{selectedPost.likes?.length || 0}</span>
              <span className="dislike-icon" title="Dislikes">👎</span>
              <span className="dislike-count">{selectedPost.dislikes?.length || 0}</span>
            </div>
            {/* Comentarios */}
            <CommentSection postId={selectedPost.id} user={user} showAll={false} />
            <button onClick={()=>setSelectedPost(null)} style={{marginTop:'12px',background:'#888'}}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CommentSection({ postId, user, showAll = false }: { postId: string; user: any; showAll?: boolean }) {
  const [comments, setComments] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'comments'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.filter(doc => doc.data().postId === postId).map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [postId]);

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('¿Eliminar este comentario?')) {
      await deleteDoc(doc(db, 'comments', commentId));
    }
  };

  const visibleComments = showAll ? comments : comments.slice(0, 5);
  const hasMore = comments.length > 5 && !showAll;

  function formatHour(date: any) {
    if (!date?.toDate) return '';
    const d = date.toDate();
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  function getFirstName(name: string) {
    if (!name) return '';
    return name.split(' ')[0];
  }

  return (
    <div className="comments-section">
      <div className="comments-list">
        {visibleComments.map(c => (
          <div
            key={c.id}
            className="comment-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              gap: '8px',
              marginBottom: '4px',
              minHeight: '28px',
            }}
          >
            <span
              className="comment-user"
              style={{
                fontWeight: 'bold',
                color: '#1976d2',
                flexShrink: 0,
                marginRight: '2px',
              }}
            >
              {getFirstName(c.userName)}:
            </span>
            <span
              className="comment-text"
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '180px',
                marginLeft: '2px',
                marginRight: '8px',
                flexGrow: 1,
                display: 'inline-block',
              }}
            >
              {c.text}
            </span>
            <span
              className="comment-date"
              style={{
                color: '#888',
                fontSize: '0.9em',
                marginLeft: 'auto',
                flexShrink: 0,
              }}
            >
              {formatHour(c.createdAt)}
            </span>
            {user && c.userId === user.uid && (
              <span
                className="icon-action"
                title="Eliminar comentario"
                style={{
                  color: '#e74c3c',
                  fontSize: '1.1rem',
                  marginLeft: '6px',
                  cursor: 'pointer',
                }}
                onClick={() => handleDeleteComment(c.id)}
              >
                &#128465;
              </span>
            )}
          </div>
        ))}
      </div>
      {hasMore && (
        <button style={{marginTop:'8px',background:'#1877f2'}} onClick={()=>navigate(`/posts/${postId}`)}>Ver todos los comentarios</button>
      )}
    </div>
  );
}