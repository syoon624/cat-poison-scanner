/**
 * ============================================
 * SettingsPage - 설정 페이지
 * ============================================
 * 사용자 프로필, 고양이 관리, 로그아웃, 계정 삭제 기능.
 */

import { useState, useEffect, useCallback } from 'react';
import { getCats, createCat, updateCat, deleteCat, deleteAccount } from '../services/api';
import useStore from '../store/useStore';
import './SettingsPage.css';

export default function SettingsPage() {
  const { user, logout, cats, setCats, addCat, updateCatInList, removeCat, selectedCat, setSelectedCat } = useStore();
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', birthDate: '', weight: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadCats = useCallback(async () => {
    try {
      const result = await getCats();
      if (result.success) setCats(result.cats);
    } catch (err) {
      console.error('고양이 목록 로드 실패:', err);
    }
  }, [setCats]);

  useEffect(() => { loadCats(); }, [loadCats]);

  const handleSaveCat = async () => {
    if (!catForm.name.trim()) return alert('이름을 입력해주세요.');

    try {
      const data = {
        name: catForm.name.trim(),
        birthDate: catForm.birthDate || null,
        weight: catForm.weight ? Number(catForm.weight) : null,
      };

      if (editingCat) {
        const result = await updateCat(editingCat._id, data);
        if (result.success) updateCatInList(result.cat);
      } else {
        const result = await createCat(data);
        if (result.success) addCat(result.cat);
      }

      closeCatModal();
    } catch (err) {
      console.error('고양이 저장 실패:', err);
      alert('저장에 실패했습니다.');
    }
  };

  const handleDeleteCat = async (cat) => {
    if (!window.confirm(`"${cat.name}" 프로필을 삭제할까요?`)) return;
    try {
      await deleteCat(cat._id);
      removeCat(cat._id);
    } catch (err) {
      console.error('고양이 삭제 실패:', err);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      logout();
    } catch (err) {
      console.error('계정 삭제 실패:', err);
      alert('계정 삭제에 실패했습니다.');
    }
  };

  const openAddCat = () => {
    setEditingCat(null);
    setCatForm({ name: '', birthDate: '', weight: '' });
    setShowCatModal(true);
  };

  const openEditCat = (cat) => {
    setEditingCat(cat);
    setCatForm({
      name: cat.name,
      birthDate: cat.birthDate ? cat.birthDate.split('T')[0] : '',
      weight: cat.weight || '',
    });
    setShowCatModal(true);
  };

  const closeCatModal = () => {
    setShowCatModal(false);
    setEditingCat(null);
    setCatForm({ name: '', birthDate: '', weight: '' });
  };

  return (
    <div className="settings-page">
      {/* ─── 사용자 프로필 ─── */}
      <section className="settings-section">
        <h2>👤 내 프로필</h2>
        <div className="profile-card">
          {user?.profileImage ? (
            <img src={user.profileImage} alt="프로필" className="profile-img" referrerPolicy="no-referrer" />
          ) : (
            <div className="profile-img-placeholder">👤</div>
          )}
          <div className="profile-info">
            <strong>{user?.displayName || '사용자'}</strong>
            <span>{user?.email}</span>
          </div>
        </div>
      </section>

      {/* ─── 고양이 관리 ─── */}
      <section className="settings-section">
        <div className="section-header">
          <h2>🐱 내 고양이</h2>
          <button className="add-cat-btn" onClick={openAddCat}>+ 추가</button>
        </div>

        {cats.length === 0 ? (
          <div className="empty-cats">
            <p>등록된 고양이가 없습니다.</p>
            <button className="add-first-cat" onClick={openAddCat}>첫 고양이 등록하기</button>
          </div>
        ) : (
          <div className="cat-list">
            {cats.map((cat) => (
              <div
                key={cat._id}
                className={`cat-card ${selectedCat?._id === cat._id ? 'selected' : ''}`}
                onClick={() => setSelectedCat(cat)}
              >
                <div className="cat-info">
                  <strong>{cat.name}</strong>
                  <span>
                    {cat.weight ? `${cat.weight}kg` : ''}
                    {cat.weight && cat.birthDate ? ' · ' : ''}
                    {cat.birthDate ? new Date(cat.birthDate).toLocaleDateString('ko-KR') : ''}
                  </span>
                </div>
                <div className="cat-actions">
                  {selectedCat?._id === cat._id && <span className="selected-badge">선택됨</span>}
                  <button className="cat-edit-btn" onClick={(e) => { e.stopPropagation(); openEditCat(cat); }}>수정</button>
                  <button className="cat-delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteCat(cat); }}>삭제</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── 계정 관리 ─── */}
      <section className="settings-section">
        <h2>계정</h2>
        <button className="logout-btn" onClick={logout}>로그아웃</button>
        <button className="delete-account-btn" onClick={() => setShowDeleteConfirm(true)}>계정 삭제</button>
      </section>

      {/* ─── 고양이 추가/수정 모달 ─── */}
      {showCatModal && (
        <div className="modal-overlay" onClick={closeCatModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingCat ? '🐱 고양이 수정' : '🐱 새 고양이 등록'}</h3>
            <label className="modal-label">이름 *</label>
            <input
              className="modal-input"
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              placeholder="예: 나비"
            />
            <label className="modal-label">생년월일</label>
            <input
              className="modal-input"
              type="date"
              value={catForm.birthDate}
              onChange={(e) => setCatForm({ ...catForm, birthDate: e.target.value })}
            />
            <label className="modal-label">체중 (kg)</label>
            <input
              className="modal-input"
              type="number"
              step="0.1"
              value={catForm.weight}
              onChange={(e) => setCatForm({ ...catForm, weight: e.target.value })}
              placeholder="예: 4.2"
            />
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={closeCatModal}>취소</button>
              <button className="save-btn" onClick={handleSaveCat}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 계정 삭제 확인 모달 ─── */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content danger" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ 정말 계정을 삭제하시겠습니까?</h3>
            <p className="danger-text">
              모든 고양이 프로필, 스캔 기록, 타임라인 데이터가 영구적으로 삭제됩니다.
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>취소</button>
              <button className="danger-btn" onClick={handleDeleteAccount}>삭제하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
