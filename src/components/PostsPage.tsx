import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, query, orderBy, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/PostsPage.css';
import { FaTrashAlt, FaEdit } from 'react-icons/fa';

const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Público', icon: '🌐' },
  { value: 'private', label: 'Solo yo', icon: '🔒' },
  { value: 'friends', label: 'Amigos', icon: '👥' },
];

function PrivacySelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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

function CommentSection({ postId, user }: { postId: string; user: any }) {
  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'comments'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.filter(doc => doc.data().postId === postId).map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [postId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !comment.trim()) return;
    await addDoc(collection(db, 'comments'), {
      postId,
      userId: user.uid,
      userName: user.displayName || user.email,
      text: comment,
      createdAt: serverTimestamp()
    });
    setComment('');
  };

  function getFirstName(name: string) {
    if (!name) return '';
    return name.split(' ')[0];
  }

  function formatHour(date: any) {
    if (!date?.toDate) return '';
    const d = date.toDate();
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  const visibleComments = comments.slice(0, 5);
  const hasMore = comments.length > 5;

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
                marginRight: '-5px', // Menos espacio
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
                maxWidth: '350px', // Más ancho
                marginLeft: '1px', // Menos espacio
                marginRight: '5px',
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
                onClick={() => {
                  if(window.confirm('¿Eliminar este comentario?')) {
                    deleteDoc(doc(db, 'comments', c.id));
                  }
                }}
              >
                &#128465;
              </span>
            )}
          </div>
        ))}
      </div>
      {hasMore && (
        <button style={{marginTop:'8px',background:'#1877f2',color:'#fff',border:'none',borderRadius:'4px',padding:'4px 10px',cursor:'pointer'}} onClick={()=>navigate(`/posts/${postId}`)}>Ver todos los comentarios</button>
      )}
      <form onSubmit={handleAddComment} className="comment-form">
        <input
          type="text"
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Escribe un comentario..."
          maxLength={200}
        />
        <button type="submit">Comentar</button>
      </form>
    </div>
  );
}

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ title: string; description: string; imageUrl: string; privacy: string }>({ title: '', description: '', imageUrl: '', privacy: 'public' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) navigate('/');
      else setUser(currentUser);
    });
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubscribeAuth(); unsubscribePosts(); };
  }, [navigate]);

  const openCreateModal = () => {
    setForm({ title: '', description: '', imageUrl: '', privacy: 'public' });
    setEditingId(null);
    setShowForm(true);
  };

  const openEditModal = (post: any) => {
    setForm({
      title: post.title,
      description: post.description,
      imageUrl: post.imageUrl || '',
      privacy: post.privacy || 'public',
    });
    setEditingId(post.id);
    setShowForm(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (editingId) {
      await updateDoc(doc(db, 'posts', editingId), {
        title: form.title,
        description: form.description,
        imageUrl: form.imageUrl,
        privacy: form.privacy,
        updatedAt: new Date(),
      });
    } else {
      await addDoc(collection(db, 'posts'), {
        userId: user.uid,
        userName: user.displayName || user.email,
        title: form.title,
        description: form.description,
        imageUrl: form.imageUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: [],
        dislikes: [],
        privacy: form.privacy,
      });
    }
    setShowForm(false);
    setForm({ title: '', description: '', imageUrl: '', privacy: 'public' });
    setEditingId(null);
  };

  return (
    <div className="posts-page-centered">
      <Header />
      <div className="posts-title">Jala News</div>
      <div className="posts-list-centered">
        {posts.map(post => {
          const isOwner = user && post.userId === user.uid;
          const privacyOpt = PRIVACY_OPTIONS.find(opt => opt.value === post.privacy) || PRIVACY_OPTIONS[0];
          return (
            <div key={post.id} className="post-card-centered">
              <div className="post-header" style={{position:'relative',display:'flex',alignItems:'center',gap:'10px'}}>
                <span className="post-user">{post.userName}</span>
                <span className="privacy-icon-large" title={privacyOpt.label}>{privacyOpt.icon}</span>
                <div style={{marginLeft:'auto',display:'flex',gap:'8px',alignItems:'center'}}>
                  <span
                    className="icon-action"
                    title="Editar"
                    style={{color: isOwner ? undefined : '#ccc', cursor: isOwner ? 'pointer' : 'not-allowed'}}
                    onClick={() => {
                      if (isOwner) openEditModal(post);
                      else window.alert('Post inhabilitado para edición');
                    }}
                  >
                    <FaEdit />
                  </span>
                  {isOwner && (
                    <span className="icon-action" title="Eliminar" onClick={async()=>{if(window.confirm('¿Eliminar este post?')) await deleteDoc(doc(db,'posts',post.id));}}><FaTrashAlt /></span>
                  )}
                </div>
              </div>
              <h3 className="post-title" style={{margin:0}}>{post.title}</h3>
              <p className="post-description">{post.description}</p>
              {post.imageUrl && <img src={post.imageUrl} alt="Post" className="post-image-centered" />}
              <div className="post-meta-centered">
                <span>{post.createdAt?.toDate?.().toLocaleString?.() || ''}</span>
              </div>
              <div className="post-actions-centered">
                <span className="like-icon" title="Likes">👍</span>
                <span className="like-count">{post.likes?.length || 0}</span>
                <span className="dislike-icon" title="Dislikes">👎</span>
                <span className="dislike-count">{post.dislikes?.length || 0}</span>
              </div>
              <CommentSection postId={post.id} user={user} />
            </div>
          );
        })}
      </div>
      <div className="create-post-bottom">
        <button onClick={openCreateModal}>Crear Post</button>
      </div>
      {showForm && (
        <div className="create-post-modal">
          <div className="create-post-content">
            <h3>{editingId ? 'Editar post' : 'Crear nuevo post'}</h3>
            <form onSubmit={handleSubmit} className="post-form">
              <input name="title" value={form.title} onChange={handleFormChange} placeholder="Título" required maxLength={80} />
              <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Descripción" required maxLength={500} />
              <input name="imageUrl" value={form.imageUrl} onChange={handleFormChange} placeholder="URL de imagen (opcional)" />
              <div style={{display:'flex',alignItems:'center',gap:'8px',margin:'8px 0'}}>
                <span>Privacidad:</span>
                <PrivacySelector value={form.privacy} onChange={v=>setForm(f=>({...f,privacy:v}))} />
              </div>
              <button type="submit">{editingId ? 'Guardar cambios' : 'Publicar'}</button>
            </form>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} style={{background:'#888',marginTop:'8px'}}>Cancelar</button>
          </div>
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
    { to: '/about', label: 'About' },
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