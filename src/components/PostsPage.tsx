import React, { useEffect, useState } from 'react';
import { db, auth, followUser, unfollowUser, isFollowing, createPostWithNotifications } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, query, orderBy, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/PostsPage.css';
import { FaTrashAlt, FaEdit, FaUserPlus, FaUserCheck } from 'react-icons/fa';
import Header from './Header';

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

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: any;
}

function CommentSection({ postId, user }: { postId: string; user: User | null }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'comments'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.filter(doc => doc.data().postId === postId).map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          userId: d.userId || '',
          userName: d.userName || '',
          text: d.text || '',
          createdAt: d.createdAt,
        };
      }));
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

  function formatHour(date: { toDate: () => Date }) {
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
        <button type="submit">Comment</button>
      </form>
    </div>
  );
}

interface Post {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  title: string;
  description: string;
  imageUrl?: string;
  createdAt?: any;
  updatedAt?: any;
  likes?: string[];
  dislikes?: string[];
  privacy?: string;
}
interface PopupUser {
  userId: string;
  userName: string;
  userEmail: string;
  isFollowing: boolean;
}

interface User {
  uid: string;
  displayName?: string;
  email?: string;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ title: string; description: string; imageUrl: string; privacy: string }>({ title: '', description: '', imageUrl: '', privacy: 'public' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const navigate = useNavigate();
  // 1. Agregar estado para el archivo de imagen
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [popupUser, setPopupUser] = useState<PopupUser | null>(null);
  const [followMap, setFollowMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) navigate('/');
      else setUser({
        uid: currentUser.uid,
        displayName: currentUser.displayName || undefined,
        email: currentUser.email || undefined,
      });
    });
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          userId: d.userId || '',
          userName: d.userName || '',
          userEmail: d.userEmail || '',
          title: d.title || '',
          description: d.description || '',
          imageUrl: d.imageUrl || '',
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          likes: d.likes || [],
          dislikes: d.dislikes || [],
          privacy: d.privacy || 'public',
        };
      }));
    });
    return () => { unsubscribeAuth(); unsubscribePosts(); };
  }, [navigate]);

  const openCreateModal = () => {
    setForm({ title: '', description: '', imageUrl: '', privacy: 'public' });
    setEditingId(null);
    setShowForm(true);
  };

  const openEditModal = (post: Post) => {
    setForm({
      title: post.title,
      description: post.description,
      imageUrl: post.imageUrl || '',
      privacy: post.privacy || 'public',
    });
    setEditingId(post.id);
    setShowForm(true);
  };

  // 2. Modificar handleFormChange para ignorar imageUrl (solo para texto y textarea)
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.target.name === 'imageUrl') return; // Ya no usamos imageUrl directo
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 3. Nueva función para subir imagen a Cloudinary
  async function uploadImageToCloudinary(file: File): Promise<string> {
    const url = 'https://api.cloudinary.com/v1_1/dyhuugw7d/image/upload';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ImagePost'); // Respeta la mayúscula inicial
    const res = await fetch(url, { method: 'POST', body: formData });
    const data = await res.json();
    console.log('Cloudinary response:', data);
    if (!data.secure_url) throw new Error('Error uploading image');
    return data.secure_url;
  }

  // 4. Modificar handleSubmit para subir la imagen si hay archivo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    let imageUrl = form.imageUrl;
    if (imageFile) {
      imageUrl = await uploadImageToCloudinary(imageFile);
    }
    if (editingId) {
      await updateDoc(doc(db, 'posts', editingId), {
        title: form.title,
        description: form.description,
        imageUrl,
        privacy: form.privacy,
        updatedAt: new Date(),
      });
    } else {
      await createPostWithNotifications({
        userId: user.uid,
        userName: user.displayName || user.email,
        title: form.title,
        description: form.description,
        imageUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: [],
        dislikes: [],
        privacy: form.privacy,
      });
    }
    setShowForm(false);
    setForm({ title: '', description: '', imageUrl: '', privacy: 'public' });
    setImageFile(null);
    setEditingId(null);
  };

  const handleUserClick = async (userId: string, userName: string, userEmail: string) => {
    if (!user) return;
    let following = followMap[userId];
    if (following === undefined) {
      following = await isFollowing(user.uid, userId);
      setFollowMap(fm => ({ ...fm, [userId]: following }));
    }
    setPopupUser({ userId, userName, userEmail, isFollowing: following });
  };

  function FollowIcon({ userId, postUserId }: { userId: string; postUserId: string }) {
    const following = followMap[postUserId];
    useEffect(() => {
      if (userId && postUserId && following === undefined && userId !== postUserId) {
        isFollowing(userId, postUserId).then(f => setFollowMap(fm => ({ ...fm, [postUserId]: f })));
      }
    }, [userId, postUserId, following]);
    if (!userId || userId === postUserId || following === undefined) return null;
    return (
      <span
        className="follow-icon"
        style={{marginLeft:'4px',cursor:'pointer',color:following?'#1976d2':'#888',fontSize:'1.2em'}}
        title={following ? 'Following' : 'Follow me'}
        onClick={async () => {
          if (following) {
            if (window.confirm('Are you sure you want to unfollow this user?')) {
              await unfollowUser(userId, postUserId);
              setFollowMap(fm => ({ ...fm, [postUserId]: false }));
            }
          } else {
            await followUser(userId, postUserId);
            setFollowMap(fm => ({ ...fm, [postUserId]: true }));
          }
        }}
        onMouseOver={e => { e.currentTarget.title = following ? 'Following' : 'Follow me'; }}
      >
        {following ? <FaUserCheck /> : <FaUserPlus />}
      </span>
    );
  }

  function UserPopup({ userId, userName, userEmail, currentUserId, onClose, onFollowChange, isFollowingInitial }: {
    userId: string;
    userName: string;
    userEmail: string;
    currentUserId: string;
    onClose: () => void;
    onFollowChange: (following: boolean) => void;
    isFollowingInitial: boolean;
  }) {
    const [following, setFollowing] = useState(isFollowingInitial);
    const [loading, setLoading] = useState(false);
    const isSelf = currentUserId === userId;
    useEffect(() => { setFollowing(isFollowingInitial); }, [isFollowingInitial]);
    const handleFollow = async () => {
      setLoading(true);
      if (following) {
        if (window.confirm('Are you sure you want to unfollow this user?')) {
          await unfollowUser(currentUserId, userId);
          setFollowing(false);
          onFollowChange(false);
          setFollowMap(fm => ({ ...fm, [userId]: false }));
        }
      } else {
        await followUser(currentUserId, userId);
        setFollowing(true);
        onFollowChange(true);
        setFollowMap(fm => ({ ...fm, [userId]: true }));
      }
      setLoading(false);
    };
    return (
      <div className="user-popup-overlay" onClick={onClose}>
        <div className="user-popup" onClick={e => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="user-popup-close"
            aria-label="Close"
          >
            ×
          </button>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px',width:'100%'}}>
            <div>
              <div style={{fontWeight:'bold',fontSize:'1.1em'}}>{userName}</div>
              <div style={{fontSize:'0.95em',color:'#888'}}>{userEmail}</div>
            </div>
            {!isSelf && (
              <button
                className="follow-btn"
                style={{display:'flex',alignItems:'center',gap:'6px',background:following?'#e0e0e0':'#1877f2',color:following?'#1976d2':'#fff',border:'none',borderRadius:'4px',padding:'6px 12px',cursor:'pointer',position:'relative',marginLeft:'auto'}}
                onClick={handleFollow}
                disabled={loading}
                title={following ? 'Following' : 'Follow me'}
                onMouseOver={e => { e.currentTarget.title = following ? 'Following' : 'Follow me'; }}
              >
                {following ? <FaUserCheck /> : <FaUserPlus />}
                {following ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
          {isSelf && (
            <div style={{marginTop:'12px',color:'#e74c3c',fontWeight:'bold',textAlign:'center',width:'100%'}}>You cannot follow yourself.</div>
          )}
        </div>
      </div>
    );
  }

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
                <span
                  className="post-user"
                  style={{cursor:'pointer',color:'#1976d2',textDecoration:'underline'}}
                  onClick={() => handleUserClick(post.userId, post.userName, post.userEmail || post.userName)}
                  title="View user info"
                >
                  {post.userName}
                </span>
                <span className="privacy-icon-large" title={privacyOpt.label}>{privacyOpt.icon}</span>
                {/* Icono de seguir al lado del privacy */}
                {user && (
                  <FollowIcon userId={user.uid} postUserId={post.userId} />
                )}
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
        <button onClick={openCreateModal}>Create Post</button>
      </div>
      {showForm && (
        <div className="create-post-modal">
          <div className="create-post-content">
            <h3>{editingId ? 'Edit post' : 'Create new post'}</h3>
            <form onSubmit={handleSubmit} className="post-form">
              <input name="title" value={form.title} onChange={handleFormChange} placeholder="Title" required maxLength={80} />
              <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Description" required maxLength={500} />
              {/* Input de archivo para imagen */}
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
              {/* Mostrar nombre de archivo seleccionado o imagen previa si edita */}
              {imageFile ? (
                <div style={{fontSize:'0.9em',color:'#1976d2',marginBottom:'4px'}}>Selected image: {imageFile.name}</div>
              ) : (form.imageUrl && editingId && (
                <div style={{fontSize:'0.9em',color:'#888',marginBottom:'4px'}}>Current image: <a href={form.imageUrl} target="_blank" rel="noopener noreferrer">View</a></div>
              ))}
              <div style={{display:'flex',alignItems:'center',gap:'8px',margin:'8px 0'}}>
                <span>Privacy:</span>
                <PrivacySelector value={form.privacy} onChange={v=>setForm(f=>({...f,privacy:v}))} />
              </div>
              <button type="submit">{editingId ? 'Save changes' : 'Publish'}</button>
            </form>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} style={{background:'#888',marginTop:'8px'}}>Cancel</button>
          </div>
        </div>
      )}
      {popupUser && (
        <UserPopup
          userId={popupUser.userId}
          userName={popupUser.userName}
          userEmail={popupUser.userEmail}
          currentUserId={user?.uid || ''}
          onClose={() => setPopupUser(null)}
          onFollowChange={f => setPopupUser((p: PopupUser | null) => p ? {...p, isFollowing: f} : p)}
          isFollowingInitial={popupUser.isFollowing}
        />
      )}
    </div>
  );
} 