import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebaseConfig';
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import '../styles/PostsPage.css';

export default function PostDetail() {
  const { postId } = useParams();
  const [post, setPost] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) navigate('/');
      else setUser(currentUser);
    });
    if (postId) {
      const postRef = doc(db, 'posts', postId);
      const unsubscribePost = onSnapshot(postRef, (docSnap) => {
        setPost({ id: docSnap.id, ...docSnap.data() });
      });
      return () => { unsubscribeAuth(); unsubscribePost(); };
    }
  }, [postId, navigate]);

  const handleLike = async () => {
    if (!user || !post) return;
    const postRef = doc(db, 'posts', post.id);
    if (post.likes?.includes(user.uid)) {
      await updateDoc(postRef, { likes: arrayRemove(user.uid) });
    } else {
      await updateDoc(postRef, { likes: arrayUnion(user.uid), dislikes: arrayRemove(user.uid) });
    }
  };

  const handleDislike = async () => {
    if (!user || !post) return;
    const postRef = doc(db, 'posts', post.id);
    if (post.dislikes?.includes(user.uid)) {
      await updateDoc(postRef, { dislikes: arrayRemove(user.uid) });
    } else {
      await updateDoc(postRef, { dislikes: arrayUnion(user.uid), likes: arrayRemove(user.uid) });
    }
  };

  if (!post) return <div style={{textAlign:'center',marginTop:'40px'}}>Cargando...</div>;

  return (
    <div className="posts-page-centered">
      <div className="post-card-centered" style={{maxWidth:'600px',margin:'0 auto'}}>
        <button onClick={() => navigate(-1)} style={{position:'absolute',top:10,right:10,background:'#888'}}>Volver</button>
        <div className="post-header">
          <span className="post-user">{post.userName}</span>
          <span className="post-privacy" title="Público"><svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#bbb" /><text x="12" y="16" textAnchor="middle" fontSize="12" fill="#fff">🌐</text></svg></span>
        </div>
        <h2 className="post-title">{post.title}</h2>
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
        {/* Comentarios */}
        <CommentSection postId={post.id} user={user} />
      </div>
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

  return (
    <div className="comments-section">
      <div className="comments-list">
        {comments.map(c => (
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
                marginRight: '-5px',
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
                maxWidth: '350px',
                marginLeft: '1px',
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