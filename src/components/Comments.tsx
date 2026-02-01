import { useState, useEffect, useRef } from 'react';
import { Heart } from 'lucide-react';
import { supabase, supabaseEnabled } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Comment {
  id: string;
  article_url: string;
  user_id: string | null;
  username: string;
  comment_text: string;
  likes: number;
  created_at: string;
  updated_at: string;
  user_has_liked?: boolean;
}

interface CommentsProps {
  articleUrl: string;
  collapsed?: boolean;
}

export const Comments = ({ articleUrl }: CommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [sessionId] = useState(() => {
    let sid = localStorage.getItem('nuunz_session_id');
    if (!sid) {
      sid = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('nuunz_session_id', sid);
    }
    return sid;
  });

  const { user } = useAuth();
  const charLimit = 500;

  useEffect(() => {
    fetchComments();
  }, [articleUrl]);

  const fetchComments = async () => {
    if (!supabaseEnabled || !supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('article_url', articleUrl)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      if (commentsData && commentsData.length > 0) {
        const commentIds = commentsData.map(c => c.id);

        const { data: likesData } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .in('comment_id', commentIds)
          .or(`user_id.eq.${user?.id},session_id.eq.${sessionId}`);

        const likedCommentIds = new Set(likesData?.map(l => l.comment_id) || []);

        const commentsWithLikes = commentsData.map(comment => ({
          ...comment,
          user_has_liked: likedCommentIds.has(comment.id)
        }));

        setComments(commentsWithLikes);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || posting) return;

    if (!supabaseEnabled || !supabase) {
      alert('Comments are not available. Database is not configured.');
      return;
    }

    try {
      setPosting(true);

      const { error } = await supabase
        .from('comments')
        .insert({
          article_url: articleUrl,
          user_id: user?.id || null,
          username: user?.email?.split('@')[0] || 'Anonymous',
          comment_text: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      await fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const handleLikeComment = async (commentId: string, currentlyLiked: boolean) => {
    if (!supabaseEnabled || !supabase) {
      return;
    }

    try {
      if (currentlyLiked) {
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .or(`user_id.eq.${user?.id},session_id.eq.${sessionId}`);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user?.id || null,
            session_id: !user?.id ? sessionId : null
          });

        if (error) throw error;
      }

      await fetchComments();
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return `${Math.floor(seconds / 604800)}w`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePostComment();
    }
  };

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 h-full">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 dark:text-white text-sm">
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {comment.username[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold text-slate-900 dark:text-white mr-2">
                        {comment.username}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {comment.comment_text}
                      </span>
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {getTimeAgo(comment.created_at)}
                      </span>
                      {comment.likes > 0 && (
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {comment.likes} {comment.likes === 1 ? 'like' : 'likes'}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleLikeComment(comment.id, comment.user_has_liked || false)}
                    className="flex-shrink-0 transition active:scale-125"
                  >
                    <Heart
                      size={14}
                      fill={comment.user_has_liked ? 'currentColor' : 'none'}
                      className={comment.user_has_liked ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}
                      strokeWidth={2}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {user?.email?.[0].toUpperCase() || 'A'}
            </span>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a comment..."
            maxLength={charLimit}
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          {newComment.trim() && (
            <button
              onClick={handlePostComment}
              disabled={posting}
              className="text-blue-500 font-semibold text-sm hover:text-blue-600 disabled:opacity-50 transition"
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
