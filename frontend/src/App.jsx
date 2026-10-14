import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment-jalaali';

moment.locale('fa');
moment.loadPersian({ dialect: 'persian-modern' });

const API_URL = 'http://localhost:8000/api';

const toJalaali = (dateStr) => {
  if (!dateStr) return '';
  try { return moment(new Date(dateStr)).format('jYYYY/jMM/jDD'); } catch(e) { return ''; }
};

const toGregorian = (jalaliStr) => {
  if (!jalaliStr) return null;
  try { return moment(jalaliStr, 'jYYYY/jMM/jDD').format('YYYY-MM-DD'); } catch(e) { return null; }
};

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ===== مودال‌ها =====
const ReminderTasksModal = ({ tasks, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">🔔 لیست وظایف نیازمند یادآوری</h2>
        <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task.id} className="p-3 rounded-lg border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium text-gray-800 dark:text-white">{task.title}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">🏢 {task.company_name || 'بدون شرکت'}</span>
                  {task.due_date && <span className="text-xs text-gray-500 dark:text-gray-400 block">📅 سررسید: {toJalaali(task.due_date)}</span>}
                  {task.period && <span className="text-xs text-blue-500 dark:text-blue-400 block">🔄 {task.period}</span>}
                </div>
                <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">⏳ نیازمند انجام</span>
              </div>
            </div>
          ))}
          {tasks.length === 0 && <div className="text-center text-gray-500 dark:text-gray-400 py-8">هیچ وظیفه‌ای نیازمند یادآوری نیست</div>}
        </div>
        <div className="flex gap-3 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="flex-1 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition">بستن</button>
        </div>
      </div>
    </div>
  );
};

const OverdueTasksModal = ({ tasks, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">⚠️ لیست وظایف عقب‌افتاده</h2>
        <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task.id} className="p-3 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium text-gray-800 dark:text-white">{task.title}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">🏢 {task.company_name || 'بدون شرکت'}</span>
                  {task.due_date && <span className="text-xs text-red-500 dark:text-red-400 block">📅 سررسید گذشته: {toJalaali(task.due_date)}</span>}
                  {task.period && <span className="text-xs text-blue-500 dark:text-blue-400 block">🔄 {task.period}</span>}
                </div>
                <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">⚠️ عقب‌افتاده</span>
              </div>
            </div>
          ))}
          {tasks.length === 0 && <div className="text-center text-gray-500 dark:text-gray-400 py-8">هیچ وظیفه عقب‌افتاده‌ای وجود ندارد</div>}
        </div>
        <div className="flex gap-3 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="flex-1 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition">بستن</button>
        </div>
      </div>
    </div>
  );
};

const DueSoonTasksModal = ({ tasks, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-yellow-600 dark:text-yellow-400">⏰ لیست وظایف نزدیک به موعد</h2>
        <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task.id} className="p-3 rounded-lg border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium text-gray-800 dark:text-white">{task.title}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">🏢 {task.company_name || 'بدون شرکت'}</span>
                  {task.due_date && <span className="text-xs text-yellow-600 dark:text-yellow-400 block">📅 سررسید: {toJalaali(task.due_date)}</span>}
                  {task.period && <span className="text-xs text-blue-500 dark:text-blue-400 block">🔄 {task.period}</span>}
                </div>
                <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">⏰ نزدیک به موعد</span>
              </div>
            </div>
          ))}
          {tasks.length === 0 && <div className="text-center text-gray-500 dark:text-gray-400 py-8">هیچ وظیفه نزدیک به موعدی وجود ندارد</div>}
        </div>
        <div className="flex gap-3 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="flex-1 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition">بستن</button>
        </div>
      </div>
    </div>
  );
};

const CopyTaskModal = ({ task, companies, onClose, onCopy }) => {
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (selectAll) {
      setSelectedCompanies(companies.map(c => c.id));
    } else {
      setSelectedCompanies([]);
    }
  }, [selectAll]);

  const toggleCompany = (companyId) => {
    if (selectedCompanies.includes(companyId)) {
      setSelectedCompanies(selectedCompanies.filter(id => id !== companyId));
    } else {
      setSelectedCompanies([...selectedCompanies, companyId]);
    }
  };

  const handleCopy = () => {
    if (selectedCompanies.length === 0) {
      alert('⚠️ لطفاً حداقل یک شرکت را انتخاب کنید');
      return;
    }
    onCopy(selectedCompanies);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">📋 کپی وظیفه</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">وظیفه: <span className="font-semibold">{task?.title}</span></p>
        <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
        <div className="mb-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={selectAll} onChange={(e) => setSelectAll(e.target.checked)} className="w-4 h-4" />
            انتخاب همه
          </label>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {companies.map(company => (
            <label key={company.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg cursor-pointer">
              <input type="checkbox" checked={selectedCompanies.includes(company.id)} onChange={() => toggleCompany(company.id)} className="w-4 h-4" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{company.name}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button onClick={handleCopy} className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition">✅ کپی</button>
          <button onClick={onClose} className="flex-1 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition">❌ انصراف</button>
        </div>
      </div>
    </div>
  );
};

const CopyFolderModal = ({ folder, companies, onClose, onCopy }) => {
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (selectAll) {
      setSelectedCompanies(companies.map(c => c.id));
    } else {
      setSelectedCompanies([]);
    }
  }, [selectAll]);

  const toggleCompany = (companyId) => {
    if (selectedCompanies.includes(companyId)) {
      setSelectedCompanies(selectedCompanies.filter(id => id !== companyId));
    } else {
      setSelectedCompanies([...selectedCompanies, companyId]);
    }
  };

  const handleCopy = () => {
    if (selectedCompanies.length === 0) {
      alert('⚠️ لطفاً حداقل یک شرکت را انتخاب کنید');
      return;
    }
    onCopy(selectedCompanies);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">📁 کپی پوشه</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          پوشه: <span className="font-semibold">{folder?.name}</span>
          <br />
          <span className="text-xs text-gray-500">(فقط نام پوشه کپی می‌شود، فایل‌ها کپی نمی‌شوند)</span>
        </p>
        <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
        <div className="mb-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={selectAll} onChange={(e) => setSelectAll(e.target.checked)} className="w-4 h-4" />
            انتخاب همه شرکت‌ها
          </label>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {companies.map(company => (
            <label key={company.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg cursor-pointer">
              <input type="checkbox" checked={selectedCompanies.includes(company.id)} onChange={() => toggleCompany(company.id)} className="w-4 h-4" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{company.name}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button onClick={handleCopy} className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">✅ کپی</button>
          <button onClick={onClose} className="flex-1 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition">❌ انصراف</button>
        </div>
      </div>
    </div>
  );
};

const EditNoteModal = ({ note, folders, onClose, onSave }) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [folderId, setFolderId] = useState(note?.folder_id || null);
  const [files, setFiles] = useState(note?.files || []);
  const [renameFiles, setRenameFiles] = useState(false);
  const [newFiles, setNewFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setNewFiles([...newFiles, ...filesArray]);
    }
  };

  const removeNewFile = (index) => {
    const updated = [...newFiles];
    updated.splice(index, 1);
    setNewFiles(updated);
  };

  const removeExistingFile = (index) => {
    const updated = [...files];
    updated.splice(index, 1);
    setFiles(updated);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('⚠️ لطفاً عنوان توضیح را وارد کنید');
      return;
    }
    if (!content.trim()) {
      alert('⚠️ لطفاً متن توضیح را وارد کنید');
      return;
    }

    setLoading(true);
    try {
      const response = await api.put(`/notes/${note.id}`, {
        title: title,
        content: content,
        folder_id: folderId,
        files: files
      });

      if (response.status === 200 || response.status === 201) {
        if (newFiles.length > 0) {
          const formData = new FormData();
          for (let i = 0; i < newFiles.length; i++) {
            let file = newFiles[i];
            if (renameFiles && title) {
              let cleanTitle = title.replace(/[\\/*?:"<>|]/g, '_').trim();
              if (!cleanTitle) cleanTitle = 'file';
              const extension = file.name.split('.').pop();
              let newName;
              if (newFiles.length === 1) {
                newName = `${cleanTitle}.${extension}`;
              } else {
                newName = `${cleanTitle}_${i + 1}.${extension}`;
              }
              try {
                const newFile = new File([file], newName, { type: file.type });
                formData.append('files', newFile);
              } catch (e) {
                formData.append('files', file);
              }
            } else {
              formData.append('files', file);
            }
          }
          const token = localStorage.getItem('token');
          await axios.post(
            `${API_URL}/notes/upload-multiple/${note.id}`,
            formData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              }
            }
          );
        }
        onSave();
        alert('✅ توضیح با موفقیت ویرایش شد!');
      }
    } catch (error) {
      console.error('خطا در ویرایش توضیح:', error);
      alert('❌ خطا در ویرایش توضیح: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">✏️ ویرایش توضیح</h2>
        <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
        
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">عنوان</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-dark-card dark:text-white"
          />
        </div>
        
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">متن</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="4"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-dark-card dark:text-white resize-none"
          />
        </div>
        
        {folders.length > 0 && (
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">پوشه</label>
            <select 
              value={folderId || ''} 
              onChange={(e) => setFolderId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-dark-card dark:text-white"
            >
              <option value="">📁 بدون پوشه</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>📁 {f.name}</option>
              ))}
            </select>
          </div>
        )}
        
        <div className="mb-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input 
              type="checkbox" 
              checked={renameFiles} 
              onChange={(e) => setRenameFiles(e.target.checked)} 
              className="w-4 h-4" 
            />
            🔄 تغییر نام فایل‌ها با عنوان توضیح
          </label>
        </div>
        
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">فایل‌های موجود</label>
          <div className="space-y-2">
            {files.map((file, idx) => {
              const filename = file.split('/').pop() || 'فایل';
              return (
                <div key={idx} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
                  <span className="text-sm text-gray-700 dark:text-gray-300">📄 {filename}</span>
                  <button
                    onClick={() => removeExistingFile(idx)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
            {files.length === 0 && (
              <div className="text-sm text-gray-400 dark:text-gray-500">هیچ فایلی وجود ندارد</div>
            )}
          </div>
        </div>
        
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">افزودن فایل‌های جدید</label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-dark-card dark:text-white"
          />
          {newFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {newFiles.map((file, idx) => (
                <span key={idx} className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded flex items-center gap-1">
                  📄 {file.name}
                  <button onClick={() => removeNewFile(idx)} className="text-red-500 hover:text-red-700">✕</button>
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-3 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
          >
            {loading ? '⏳ در حال ذخیره...' : '💾 ذخیره تغییرات'}
          </button>
          <button 
            onClick={onClose} 
            className="flex-1 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition"
          >
            ❌ انصراف
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== کامپوننت اصلی App =====
function App() {
  const [isDark, setIsDark] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const [companies, setCompanies] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [newCompany, setNewCompany] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newTemplate, setNewTemplate] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [taskPeriod, setTaskPeriod] = useState('یکبار');
  const [templatePeriod, setTemplatePeriod] = useState('یکبار');
  const [requireUpload, setRequireUpload] = useState(false);
  const [dueDate, setDueDate] = useState(() => moment().format('jYYYY/jMM/jDD'));
  const [weekDay, setWeekDay] = useState('');
  const [reminderDays, setReminderDays] = useState(3);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [dueSoonTasks, setDueSoonTasks] = useState([]);
  const [reminderTasks, setReminderTasks] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteFiles, setNoteFiles] = useState([]);
  const [noteFolderId, setNoteFolderId] = useState(null);
  const [renameNoteFiles, setRenameNoteFiles] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [folderFilter, setFolderFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  
  const [editingNote, setEditingNote] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [selectedTaskForCopy, setSelectedTaskForCopy] = useState(null);
  const [copyFolderModalOpen, setCopyFolderModalOpen] = useState(false);
  const [selectedFolderForCopy, setSelectedFolderForCopy] = useState(null);
  
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [showDueSoonModal, setShowDueSoonModal] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      loadAllData();
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const loadAllData = async () => {
    await fetchCompanies();
    await fetchTemplates();
    await fetchDashboard();
    await fetchReminders();
    if (selectedCompany) {
      await fetchNotes(selectedCompany.id);
      await fetchFolders(selectedCompany.id);
    }
    await fetchAllTasks();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      const response = await axios.post(`${API_URL}/login`, { username, password });
      
      if (response.status === 200) {
        const { access_token } = response.data;
        localStorage.setItem('token', access_token);
        localStorage.setItem('username', username);
        setIsLoggedIn(true);
        await loadAllData();
      }
    } catch (error) {
      setLoginError('❌ نام کاربری یا رمز عبور اشتباه است');
      document.querySelector('.login-error')?.classList.add('show');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      await axios.post(`${API_URL}/register`, { username, password });
      setIsRegister(false);
      setLoginError('✅ ثبت‌نام موفق! حالا وارد شوید');
      const errorEl = document.querySelector('.login-error');
      if (errorEl) {
        errorEl.classList.add('show');
        errorEl.style.display = 'block';
        errorEl.style.background = '#efe';
        errorEl.style.color = '#060';
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setLoginError('❌ این نام کاربری قبلاً ثبت شده است');
      } else {
        setLoginError('❌ خطا در ثبت‌نام');
      }
      document.querySelector('.login-error')?.classList.add('show');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setCompanies([]);
    setTasks([]);
    setTemplates([]);
    setSelectedCompany(null);
    setNotes([]);
    setFolders([]);
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data);
      if (response.data.length > 0 && !selectedCompany) {
        setSelectedCompany(response.data[0]);
        fetchTasks(response.data[0].id);
        fetchNotes(response.data[0].id);
        fetchFolders(response.data[0].id);
      }
    } catch (error) {
      console.error('خطا در دریافت شرکت‌ها:', error);
      if (error.response?.status === 401) handleLogout();
    }
  };

  const fetchAllTasks = async () => {
    try {
      const response = await api.get('/tasks/all');
      setAllTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('خطا در دریافت همه وظایف:', error);
      setAllTasks([]);
    }
  };

  const fetchTasks = async (companyId) => {
    try {
      const response = await api.get(`/tasks/${companyId}`);
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('خطا در دریافت وظایف:', error);
      setTasks([]);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/templates');
      setTemplates(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('خطا در دریافت الگوها:', error);
      setTemplates([]);
    }
  };

  const fetchDashboard = async () => {
    try {
      const overdueRes = await api.get('/dashboard/overdue');
      setOverdueTasks(overdueRes.data?.tasks || []);
      const dueSoonRes = await api.get('/dashboard/due-soon?days=3');
      setDueSoonTasks(dueSoonRes.data?.tasks || []);
    } catch (error) {
      console.error('خطا در دریافت داشبورد:', error);
      setOverdueTasks([]);
      setDueSoonTasks([]);
    }
  };

  const fetchReminders = async () => {
    try {
      const response = await api.get('/dashboard/reminders');
      setReminderTasks(Array.isArray(response.data?.tasks) ? response.data.tasks : []);
    } catch (error) {
      console.error('خطا در دریافت یادآوری‌ها:', error);
      setReminderTasks([]);
    }
  };

  const fetchNotes = async (companyId) => {
    try {
      if (!companyId) {
        setNotes([]);
        return;
      }
      const response = await api.get(`/notes/company/${companyId}`);
      setNotes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('خطا در دریافت توضیحات:', error);
      setNotes([]);
    }
  };

  const fetchFolders = async (companyId) => {
    try {
      if (!companyId) {
        setFolders([]);
        return;
      }
      const response = await api.get(`/folders/company/${companyId}`);
      setFolders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('خطا در دریافت پوشه‌ها:', error);
      setFolders([]);
    }
  };

  const downloadFilesAsZip = async (noteId, noteTitle) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/notes/download-zip/${noteId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${noteTitle || 'files'}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('خطا در دانلود ZIP:', error);
      alert('❌ خطا در دانلود فایل‌ها: ' + (error.response?.data?.detail || error.message));
    }
  };

  const uploadMultipleFiles = async (noteId, files, renameWithTitle = false, noteTitle = '') => {
    if (!files || files.length === 0) return;
    
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      
      if (renameWithTitle && noteTitle) {
        let cleanTitle = noteTitle.replace(/[\\/*?:"<>|]/g, '_').trim();
        if (!cleanTitle) cleanTitle = 'file';
        const extension = file.name.split('.').pop();
        let newName;
        if (files.length === 1) {
          newName = `${cleanTitle}.${extension}`;
        } else {
          newName = `${cleanTitle}_${i + 1}.${extension}`;
        }
        try {
          const newFile = new File([file], newName, { type: file.type });
          formData.append('files', newFile);
          console.log(`📝 تغییر نام: ${file.name} -> ${newName}`);
        } catch (e) {
          console.warn('خطا در تغییر نام فایل، ارسال با نام اصلی:', e);
          formData.append('files', file);
        }
      } else {
        formData.append('files', file);
      }
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/notes/upload-multiple/${noteId}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('خطا در آپلود چند فایل:', error);
      throw error;
    }
  };

  const removeFileFromNote = (index) => {
    const newFiles = [...noteFiles];
    newFiles.splice(index, 1);
    setNoteFiles(newFiles);
  };

  const addNote = async () => {
    if (!noteTitle.trim()) {
      alert('⚠️ لطفاً عنوان توضیح را وارد کنید');
      return;
    }
    if (!noteContent.trim()) {
      alert('⚠️ لطفاً متن توضیح را وارد کنید');
      return;
    }
    if (!selectedCompany) {
      alert('⚠️ لطفاً یک شرکت را انتخاب کنید');
      return;
    }
    
    try {
      const response = await api.post('/notes', {
        title: noteTitle,
        content: noteContent,
        company_id: selectedCompany.id,
        folder_id: noteFolderId || null,
        files: []
      });
      
      if (response.status === 201 || response.status === 200) {
        const newNote = response.data;
        
        if (noteFiles.length > 0) {
          try {
            await uploadMultipleFiles(
              newNote.id, 
              noteFiles, 
              renameNoteFiles,
              noteTitle
            );
          } catch (uploadError) {
            console.error('خطا در آپلود فایل‌ها:', uploadError);
            alert('⚠️ توضیح ذخیره شد اما خطا در آپلود فایل‌ها رخ داد');
          }
        }
        
        setNoteTitle('');
        setNoteContent('');
        setNoteFiles([]);
        setNoteFolderId(null);
        setRenameNoteFiles(false);
        await fetchNotes(selectedCompany.id);
        alert('✅ توضیح با موفقیت اضافه شد!');
      }
    } catch (error) {
      console.error('خطا در افزودن توضیح:', error);
      alert('❌ خطا در افزودن توضیح: ' + (error.response?.data?.detail || error.message));
    }
  };

  const deleteNote = async (noteId) => {
    if (!window.confirm('آیا از حذف این توضیح مطمئن هستید؟')) return;
    try {
      await api.delete(`/notes/${noteId}`);
      await fetchNotes(selectedCompany.id);
      alert('✅ توضیح با موفقیت حذف شد!');
    } catch (error) {
      console.error('خطا در حذف توضیح:', error);
      alert('❌ خطا در حذف توضیح');
    }
  };

  const openNoteFile = (filePath) => {
    if (filePath) {
      const url = `http://localhost:8000/uploads/${filePath.replace(/\\/g, '/')}`;
      window.open(url, '_blank');
    }
  };

  const deleteNoteFile = async (noteId, fileIndex) => {
    if (!window.confirm('آیا از حذف این فایل مطمئن هستید؟')) return;
    try {
      await api.delete(`/notes/file/${noteId}?file_index=${fileIndex}`);
      await fetchNotes(selectedCompany.id);
      alert('✅ فایل با موفقیت حذف شد!');
    } catch (error) {
      console.error('خطا در حذف فایل:', error);
      alert('❌ خطا در حذف فایل');
    }
  };

  const addCompany = async () => {
    if (!newCompany.trim()) {
      alert('⚠️ لطفاً نام شرکت را وارد کنید');
      return;
    }
    try {
      const response = await api.post('/companies', { name: newCompany });
      if (response.status === 201 || response.status === 200) {
        setNewCompany('');
        await fetchCompanies();
        alert('✅ شرکت با موفقیت اضافه شد!');
      }
    } catch (error) {
      console.error('خطا در افزودن شرکت:', error);
      alert('❌ خطا در افزودن شرکت: ' + (error.response?.data?.detail || error.message));
    }
  };

  const deleteCompany = async (companyId) => {
    if (!window.confirm('آیا از حذف این شرکت مطمئن هستید؟')) return;
    try {
      await api.delete(`/companies/${companyId}`);
      await fetchCompanies();
      setTasks([]);
      setSelectedCompany(null);
      setNotes([]);
      setFolders([]);
      alert('✅ شرکت با موفقیت حذف شد!');
    } catch (error) {
      console.error('خطا در حذف شرکت:', error);
      alert('❌ خطا در حذف شرکت');
    }
  };

  const addFolder = async () => {
    if (!newFolderName.trim()) {
      alert('⚠️ لطفاً نام پوشه را وارد کنید');
      return;
    }
    if (!selectedCompany) {
      alert('⚠️ لطفاً یک شرکت را انتخاب کنید');
      return;
    }
    try {
      const response = await api.post('/folders', {
        name: newFolderName,
        company_id: selectedCompany.id
      });
      if (response.status === 201 || response.status === 200) {
        setNewFolderName('');
        await fetchFolders(selectedCompany.id);
        alert('✅ پوشه با موفقیت ساخته شد!');
      }
    } catch (error) {
      console.error('خطا در ساخت پوشه:', error);
      alert('❌ خطا در ساخت پوشه: ' + (error.response?.data?.detail || error.message));
    }
  };

  const deleteFolder = async (folderId) => {
    if (!window.confirm('آیا از حذف این پوشه مطمئن هستید؟ (همه فایل‌های داخل آن حذف می‌شوند)')) return;
    try {
      await api.delete(`/folders/${folderId}`);
      await fetchFolders(selectedCompany.id);
      alert('✅ پوشه با موفقیت حذف شد!');
    } catch (error) {
      console.error('خطا در حذف پوشه:', error);
      alert('❌ خطا در حذف پوشه');
    }
  };

  const copyFolder = async (folderId, companyIds) => {
    try {
      const response = await api.post(`/folders/copy/${folderId}`, { company_ids: companyIds });
      if (response.status === 200 || response.status === 201) {
        alert('✅ پوشه با موفقیت کپی شد!');
        setCopyFolderModalOpen(false);
        await fetchFolders(selectedCompany.id);
      }
    } catch (error) {
      console.error('خطا در کپی پوشه:', error);
      alert('❌ خطا در کپی پوشه: ' + (error.response?.data?.detail || error.message));
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) {
      alert('⚠️ لطفاً نام وظیفه را وارد کنید');
      return;
    }
    if (!selectedCompany) {
      alert('⚠️ لطفاً یک شرکت را انتخاب کنید');
      return;
    }
    
    let finalDueDate = null;
    
    if (taskPeriod === 'هفتگی' && weekDay) {
      const dayMap = {
        'شنبه': 0, 'یکشنبه': 1, 'دوشنبه': 2, 'سه‌شنبه': 3, 'چهارشنبه': 4, 'پنجشنبه': 5, 'جمعه': 6
      };
      const targetDay = dayMap[weekDay];
      const today = new Date();
      const currentDay = today.getDay();
      let diff = targetDay - currentDay;
      if (diff < 0) diff += 7;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + diff);
      finalDueDate = targetDate.toISOString().split('T')[0];
    } else {
      finalDueDate = dueDate ? toGregorian(dueDate) : null;
    }
    
    try {
      const response = await api.post('/tasks', {
        title: newTask,
        company_id: selectedCompany.id,
        period: taskPeriod,
        due_date: finalDueDate,
        require_upload: requireUpload,
        reminder_days: reminderDays,
        folder_id: selectedFolderId || null
      });
      
      if (response.status === 201 || response.status === 200) {
        setNewTask('');
        setDueDate(moment().format('jYYYY/jMM/jDD'));
        setWeekDay('');
        setRequireUpload(false);
        setReminderDays(3);
        setSelectedFolderId(null);
        await Promise.all([
          fetchTasks(selectedCompany.id),
          fetchAllTasks(),
          fetchDashboard(),
          fetchReminders()
        ]);
        alert('✅ وظیفه با موفقیت اضافه شد!');
      }
    } catch (error) {
      console.error('خطا در افزودن وظیفه:', error);
      alert('❌ خطا در افزودن وظیفه: ' + (error.response?.data?.detail || error.message));
    }
  };

  const toggleTask = async (taskId, currentStatus) => {
    try {
      if (!currentStatus) {
        const task = tasks.find(t => t.id === taskId);
        if (task && task.period && task.period !== 'یکبار') {
          let nextDueDate = null;
          if (task.due_date) {
            const currentDate = new Date(task.due_date);
            if (task.period === 'هفتگی') {
              currentDate.setDate(currentDate.getDate() + 7);
            } else if (task.period === 'ماهانه') {
              currentDate.setMonth(currentDate.getMonth() + 1);
            } else if (task.period === 'سالانه') {
              currentDate.setFullYear(currentDate.getFullYear() + 1);
            }
            nextDueDate = currentDate.toISOString().split('T')[0];
          }
          
          await api.post('/tasks', {
            title: task.title,
            company_id: task.company_id,
            period: task.period,
            due_date: nextDueDate,
            require_upload: task.require_upload,
            reminder_days: task.reminder_days,
            folder_id: task.folder_id
          });
        }
      }
      
      await api.put(`/tasks/${taskId}`, { is_done: !currentStatus });
      await Promise.all([
        fetchTasks(selectedCompany.id),
        fetchAllTasks(),
        fetchDashboard(),
        fetchReminders()
      ]);
    } catch (error) {
      console.error('خطا در تغییر وضعیت:', error);
      alert('❌ خطا در تغییر وضعیت');
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('آیا از حذف این وظیفه مطمئن هستید؟')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      await Promise.all([
        fetchTasks(selectedCompany.id),
        fetchAllTasks(),
        fetchDashboard(),
        fetchReminders()
      ]);
      alert('✅ وظیفه با موفقیت حذف شد!');
    } catch (error) {
      console.error('خطا در حذف وظیفه:', error);
      alert('❌ خطا در حذف وظیفه');
    }
  };

  const copyTask = async (taskId, companyIds) => {
    try {
      const response = await api.post(`/tasks/copy/${taskId}`, companyIds);
      if (response.status === 200 || response.status === 201) {
        alert('✅ وظیفه با موفقیت کپی شد!');
        setCopyModalOpen(false);
        await Promise.all([
          fetchTasks(selectedCompany.id),
          fetchAllTasks(),
          fetchDashboard(),
          fetchReminders()
        ]);
      }
    } catch (error) {
      console.error('خطا در کپی وظیفه:', error);
      alert('❌ خطا در کپی وظیفه: ' + (error.response?.data?.detail || error.message));
    }
  };

  const addTemplate = async () => {
    if (!newTemplate.trim()) {
      alert('⚠️ لطفاً نام الگو را وارد کنید');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/api/templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          title: newTemplate, 
          period: templatePeriod 
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setNewTemplate('');
        fetchTemplates();
        alert('✅ الگو با موفقیت اضافه شد!');
      } else {
        alert('❌ خطا: ' + (data.detail || data.error || 'خطای ناشناخته'));
      }
    } catch (error) {
      console.error('❌ خطا:', error);
      alert('❌ خطا: ' + error.message);
    }
  };

  const deleteTemplate = async (templateId) => {
    if (!window.confirm('آیا از حذف این الگو مطمئن هستید؟')) return;
    try {
      await api.delete(`/templates/${templateId}`);
      await fetchTemplates();
      alert('✅ الگو با موفقیت حذف شد!');
    } catch (error) {
      console.error('خطا در حذف الگو:', error);
      alert('❌ خطا در حذف الگو');
    }
  };

  const applyTemplate = async (templateId) => {
    if (companies.length === 0) {
      alert('⚠️ هیچ شرکتی وجود ندارد!');
      return;
    }
    const companyIds = companies.map(c => c.id);
    if (!window.confirm(`الگو به ${companyIds.length} شرکت اعمال شود؟`)) return;
    try {
      await api.post(`/templates/apply/${templateId}`, companyIds);
      alert('✅ الگو با موفقیت به همه شرکت‌ها اعمال شد!');
      if (selectedCompany) {
        await Promise.all([
          fetchTasks(selectedCompany.id),
          fetchAllTasks(),
          fetchDashboard(),
          fetchReminders()
        ]);
      }
    } catch (error) {
      console.error('خطا در اعمال الگو:', error);
      alert('❌ خطا در اعمال الگو');
    }
  };

  const uploadFile = async (taskId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/upload/${taskId}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.status === 200 || response.status === 201) {
        await Promise.all([
          fetchTasks(selectedCompany.id),
          fetchAllTasks()
        ]);
        alert('✅ فایل با موفقیت آپلود شد!');
      }
    } catch (error) {
      console.error('خطا در آپلود فایل:', error);
      alert('❌ خطا در آپلود فایل: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const openFile = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/download/${taskId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.url) {
        window.open(`http://localhost:8000${response.data.url}`, '_blank');
      }
    } catch (error) {
      console.error('خطا در باز کردن فایل:', error);
      alert('❌ فایلی برای این وظیفه وجود ندارد.');
    }
  };

  const addToTaskScheduler = async (taskId) => {
    try {
      const response = await api.post(`/schedule-task/${taskId}`, {});
      alert('✅ ' + response.data.message);
    } catch (error) {
      console.error('خطا در افزودن به Task Scheduler:', error);
      alert('❌ خطا در افزودن به Task Scheduler');
    }
  };

  // ===== کامپوننت تقویم =====
  const PersianCalendar = ({ isDark, calendarTasks }) => {
    const currentYear = moment().jYear();
    const currentMonth = moment().jMonth() + 1;
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(currentMonth);
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem('calendarCollapsed_v3') !== 'open');
    const [calendarData, setCalendarData] = useState(null);
    const [loadingCalendar, setLoadingCalendar] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);
    const [calendarError, setCalendarError] = useState('');
    const monthNames = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
    const weekNames = ['ش','ی','د','س','چ','پ','ج'];

    const loadCalendar = async (targetYear=year, force=false) => {
      if (loadingCalendar) return;
      
      const cacheKey = `calendar_v2_${targetYear}`;
      if (!force) {
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const data = JSON.parse(cached);
            const cacheDate = new Date(data._cached_at);
            const now = new Date();
            const hoursDiff = (now - cacheDate) / (1000 * 60 * 60);
            if (hoursDiff < 24 && data.year === targetYear && data.days) {
              console.log(`📂 استفاده از کش مرورگر تقویم سال ${targetYear}`);
              setCalendarData(data);
              return;
            }
          }
        } catch(e) {}
      }
      
      setLoadingCalendar(true);
      setCalendarError('');
      try {
        const q = force ? '?refresh=true' : '';
        const r = await api.get(`/calendar/${targetYear}${q}`, { timeout: 10000 });
        if (!r.data?.days?.length) throw new Error('داده تقویم خالی است');
        
        const dataToCache = {
          ...r.data,
          _cached_at: new Date().toISOString()
        };
        localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
        console.log(`💾 تقویم سال ${targetYear} در کش مرورگر ذخیره شد`);
        
        setCalendarData(r.data);
      } catch(e) {
        console.error('Calendar load failed:', e);
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const data = JSON.parse(cached);
            setCalendarData(data);
            setCalendarError('استفاده از کش - اتصال به اینترنت برقرار نیست');
            return;
          }
        } catch(ce) {}
        setCalendarError('تقویم در دسترس نیست؛ دوباره تلاش کنید.');
      } finally {
        setLoadingCalendar(false);
      }
    };

    useEffect(() => {
      if (!collapsed && (!calendarData || calendarData.year !== year)) {
        loadCalendar(year, false);
      }
    }, [collapsed, year]);

    const toggleCollapsed = () => {
      setSelectedDay(null);
      setCollapsed(v => {
        const next = !v;
        localStorage.setItem('calendarCollapsed_v3', next ? 'closed' : 'open');
        if (!next && !calendarData) {
          setTimeout(() => loadCalendar(year, false), 0);
        }
        return next;
      });
    };

    const eventsMap = {};
    (calendarData?.days || []).forEach(d => { eventsMap[d.date] = d; });
    
    const tasksMap = {};
    const addTaskOccurrence = (key, task) => { 
      if (!tasksMap[key]) tasksMap[key] = [];
      tasksMap[key].push(task);
    };

    console.log('📋 تعداد کل وظایف:', calendarTasks?.length || 0);

    (calendarTasks || []).forEach(t => {
      if (!t?.due_date || t?.is_template) return;
      const start = moment(t.due_date);
      const startKey = start.format('jYYYY/jMM/jDD');
      const period = t.period || 'یکبار';
      if (period === 'یکبار') {
        addTaskOccurrence(startKey, t);
      } else if (period === 'هفتگی') {
        const monthStart = moment(`${year}/${month}/01`, 'jYYYY/jMM/jDD');
        const monthEnd = monthStart.clone().endOf('jMonth');
        let d = start.clone();
        while (d.isBefore(monthStart, 'day')) d.add(7, 'days');
        while (d.isSameOrBefore(monthEnd, 'day')) {
          if (d.isSameOrAfter(monthStart, 'day')) {
            addTaskOccurrence(d.format('jYYYY/jMM/jDD'), t);
          }
          d.add(7, 'days');
        }
      } else if (period === 'ماهانه') {
        const targetDay = start.jDate();
        const monthStart = moment(`${year}/${month}/01`, 'jYYYY/jMM/jDD');
        const day = Math.min(targetDay, monthStart.clone().endOf('jMonth').jDate());
        const occurrence = monthStart.clone().jDate(day);
        if (occurrence.isSameOrAfter(start, 'day')) {
          addTaskOccurrence(occurrence.format('jYYYY/jMM/jDD'), t);
        }
      } else if (period === 'سالانه') {
        const startMonth = start.jMonth() + 1;
        const startDay = start.jDate();
        if (year > start.jYear() || (year === start.jYear() && month >= startMonth)) {
          if (month === startMonth) {
            const monthStart = moment(`${year}/${month}/01`, 'jYYYY/jMM/jDD');
            const day = Math.min(startDay, monthStart.clone().endOf('jMonth').jDate());
            addTaskOccurrence(monthStart.clone().jDate(day).format('jYYYY/jMM/jDD'), t);
          }
        }
      }
    });

    console.log('📅 تعداد روزهای دارای وظیفه:', Object.keys(tasksMap).length);

    const first = moment(`${year}/${month}/1`, 'jYYYY/jM/jD');
    const offset = (first.day()+1)%7;
    const daysInMonth = first.clone().endOf('jMonth').jDate();
    const cells = [];
    for(let i=0;i<offset;i++) cells.push(null);
    for(let d=1;d<=daysInMonth;d++) cells.push(d);
    while(cells.length%7) cells.push(null);
    const todayKey = moment().format('jYYYY/jMM/jDD');

    const prev = () => {
      setSelectedDay(null);
      if(month===1){setMonth(12);setYear(y=>y-1)} else setMonth(m=>m-1);
    };
    const next = () => {
      setSelectedDay(null);
      if(month===12){setMonth(1);setYear(y=>y+1)} else setMonth(m=>m+1);
    };
    const today = () => {
      setYear(currentYear); setMonth(currentMonth); setSelectedDay(null);
      if (!calendarData || calendarData.year !== currentYear) loadCalendar(currentYear, false);
    };

    return (
      <div className={`${isDark?'bg-dark-card border-dark-border':'bg-white/95 border-gray-200'} rounded-2xl shadow-sm border mb-3 overflow-hidden calendar-compact`}>
        <div className="calendar-shell">
          <div className="calendar-head">
            <button type="button" onClick={toggleCollapsed} className="flex items-center gap-2 min-w-0 text-right" title={collapsed?'باز کردن تقویم':'جمع کردن تقویم'}>
              <span className="text-base">📅</span>
              <span className={`calendar-month-title ${isDark?'text-white':'text-gray-800'}`}>
                تقویم شمسی {collapsed ? '' : `• ${monthNames[month-1]} ${year}`}
              </span>
              <span className="text-[10px] opacity-50">{collapsed?'▼':'▲'}</span>
            </button>
            {!collapsed && (
              <div className="calendar-nav">
                <button type="button" onClick={prev} className="calendar-btn" title="ماه قبل">‹</button>
                <button type="button" onClick={today} className="calendar-btn text-blue-600" title="امروز">امروز</button>
                <button type="button" onClick={next} className="calendar-btn" title="ماه بعد">›</button>
                <button type="button" onClick={()=>loadCalendar(year,true)} disabled={loadingCalendar} className="calendar-btn text-green-600" title="به‌روزرسانی">{loadingCalendar?'…':'↻'}</button>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="calendar-grid-wrap">
              {calendarError && (
                <div className={`calendar-error mb-1 ${isDark?'bg-red-900/20 text-red-300':'bg-red-50 text-red-600'}`}>
                  ⚠️ {calendarError}
                </div>
              )}
              {loadingCalendar && !calendarData ? (
                <div className={`text-center py-3 text-[10px] ${isDark?'text-gray-400':'text-gray-500'}`}>
                  در حال دریافت اطلاعات تقویم…
                </div>
              ) : (
                <>
                  <div className="calendar-week">
                    {weekNames.map((w,i)=><div key={w} className={i===6?'text-red-500':''}>{w}</div>)}
                  </div>
                  <div className="calendar-grid">
                    {cells.map((day,index)=>{
                      if(!day) return <div key={index} className="calendar-day-empty"/>;
                      const key=`${year}/${String(month).padStart(2,'0')}/${String(day).padStart(2,'0')}`;
                      const info=eventsMap[key];
                      const fri=index%7===6;
                      const isToday=key===todayKey;
                      const isHoliday=!!info?.is_holiday||fri;
                      const dayTasks=tasksMap[key]||[];
                      return (
                        <button 
                          type="button" 
                          key={key} 
                          onClick={()=>setSelectedDay({...(info || {date:key,events:[]}),monthName:monthNames[month-1],day,tasks:dayTasks,is_holiday:!!info?.is_holiday||fri})} 
                          title={`${dayTasks.length?`${dayTasks.length} وظیفه • `:''}${info?.events?.map(e=>e.description).join('، ')||(isHoliday?'تعطیل':'')}`} 
                          className={`calendar-day ${isToday?'today ':''}${isHoliday&&!isToday?'holiday ':''}${dayTasks.length?'has-task ':''}${isDark?'text-gray-200':'text-gray-700'}`}
                        >
                          {day}
                          {info?.events?.length>0&&<span className="calendar-event-dot"/>}
                          {dayTasks.length>0&&<span className="calendar-task-count">{dayTasks.length}</span>}
                        </button>
                      );
                    })}
                  </div>
                  {selectedDay && (
                    <div className={`calendar-details ${isDark?'bg-dark-bg border-dark-border':'bg-blue-50/60 border-blue-200'}`}>
                      <div className="flex justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className={`font-bold text-[10px] ${isDark?'text-white':'text-white'}`}>
                            {selectedDay.day} {selectedDay.monthName} {year}
                          </div>
                          {selectedDay.is_holiday&&(
                            <div className="text-white font-semibold text-[9px] mt-1">🔴 تعطیل رسمی / جمعه</div>
                          )}
                          {selectedDay.events?.map((e,i)=>(
                            <div key={i} className="text-[9px] mt-1 truncate text-white">🟠 {e.description}</div>
                          ))}
                          {selectedDay.tasks?.length>0&&(
                            <div className="mt-1.5 border-t pt-1.5 border-gray-200 dark:border-gray-700">
                              <div className="font-bold text-blue-300 text-[9px]">📋 وظایف ({selectedDay.tasks.length})</div>
                              {selectedDay.tasks.map(t=>(
                                <div key={t.id} className={`text-[9px] py-0.5 text-white ${t.is_done?'line-through opacity-60':''}`}>
                                  🔵 {t.title}{t.company_name?` — ${t.company_name}`:''}
                                </div>
                              ))}
                            </div>
                          )}
                          {!selectedDay.events?.length&&!selectedDay.tasks?.length&&(
                            <div className="text-[9px] mt-1 text-white/70">برای این روز موردی ثبت نشده است.</div>
                          )}
                        </div>
                        <button type="button" onClick={()=>setSelectedDay(null)} className="text-gray-400 text-xs">✕</button>
                      </div>
                    </div>
                  )}
                  <div className={`calendar-legend ${isDark?'text-gray-400':'text-gray-600'}`}>
                    <span>🔴 تعطیل</span>
                    <span>🟠 مناسبت</span>
                    <span>🔵 وظیفه</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const DayPicker = ({ value, onChange }) => {
    const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
    
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-dark-bg dark:text-white"
      >
        <option value="">انتخاب روز</option>
        {days.map(day => (
          <option key={day} value={day}>{day}</option>
        ))}
      </select>
    );
  };

  // ===== فیلتر توضیحات =====
  const getFilteredNotes = () => {
    let filtered = [...notes];
    
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(term) || 
        note.content.toLowerCase().includes(term)
      );
    }
    
    const now = moment();
    if (dateFilter === '30days') {
      const thirtyDaysAgo = now.clone().subtract(30, 'days');
      filtered = filtered.filter(note => moment(note.created_at).isAfter(thirtyDaysAgo));
    } else if (dateFilter === '90days') {
      const ninetyDaysAgo = now.clone().subtract(90, 'days');
      filtered = filtered.filter(note => moment(note.created_at).isAfter(ninetyDaysAgo));
    } else if (dateFilter === 'thisyear') {
      const startOfYear = now.clone().startOf('jYear');
      filtered = filtered.filter(note => moment(note.created_at).isAfter(startOfYear));
    }
    
    if (folderFilter !== 'all') {
      filtered = filtered.filter(note => note.folder_id === Number(folderFilter));
    }
    
    if (sortOrder === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }
    
    return filtered;
  };

  const toggleNoteExpand = (noteId) => {
    setExpandedNotes(prev => ({
      ...prev,
      [noteId]: !prev[noteId]
    }));
  };

  const openEditModal = (note) => {
    setEditingNote(note);
    setShowEditModal(true);
  };

  const handleNoteUpdate = () => {
    setShowEditModal(false);
    setEditingNote(null);
    fetchNotes(selectedCompany.id);
  };

  const filteredNotes = getFilteredNotes();

  if (!isLoggedIn) {
    return (
      <div className="login-container backdrop-blur-lg bg-opacity-90">
        <div className="login-box backdrop-blur-xl bg-white/90 dark:bg-dark-card/90">
          <h1 className={isDark ? 'text-white' : ''}>📊 مدیریت وظایف</h1>
          <p className="subtitle">{isRegister ? 'ثبت‌نام جدید' : 'ورود به سیستم'}</p>
          <div className="login-error">{loginError}</div>
          <form onSubmit={isRegister ? handleRegister : handleLogin}>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>نام کاربری</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="login-input" placeholder="نام کاربری" required autoFocus />
            </div>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>رمز عبور</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="login-input" placeholder="رمز عبور" required />
            </div>
            <button type="submit" className="login-btn">{isRegister ? 'ثبت‌نام' : 'ورود'}</button>
          </form>
          <div className="register-link">
            {isRegister ? (
              <>قبلاً ثبت‌نام کرده‌اید؟ <span onClick={() => { setIsRegister(false); setLoginError(''); document.querySelector('.login-error')?.classList.remove('show'); }}>ورود</span></>
            ) : (
              <>حساب کاربری ندارید؟ <span onClick={() => { setIsRegister(true); setLoginError(''); document.querySelector('.login-error')?.classList.remove('show'); }}>ثبت‌نام</span></>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-bg' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50'}`} dir="rtl">
      <button onClick={toggleTheme} className="theme-toggle backdrop-blur-lg bg-white/80 dark:bg-dark-card/80">{isDark ? '☀️' : '🌙'}</button>
      <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-3 lg:px-4 py-3 sm:py-4">
        <div className={`${isDark ? 'bg-dark-card' : 'bg-white/80'} backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-6`}>
          <div className="flex justify-between items-center">
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>📊 مدیریت وظایف حسابداری</h1>
            <div className="flex items-center gap-4">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>👤 {localStorage.getItem('username')}</span>
              <button onClick={handleLogout} className="text-red-500 hover:text-red-700 text-sm font-semibold">خروج</button>
            </div>
          </div>
        </div>

        <PersianCalendar isDark={isDark} calendarTasks={allTasks} />

        {reminderTasks.length > 0 && (
          <div 
            className="bg-blue-50 dark:bg-blue-900/20 backdrop-blur-lg border-2 border-blue-300 dark:border-blue-700 rounded-2xl shadow-lg p-4 mb-6 cursor-pointer hover:shadow-xl transition-all hover:scale-[1.01]"
            onClick={() => setShowReminderModal(true)}
          >
            <h3 className="text-blue-700 dark:text-blue-400 font-bold text-lg flex items-center gap-2">
              🔔 وظایف نیازمند یادآوری
              <span className="bg-blue-500 text-white rounded-full px-3 py-1 text-sm">{reminderTasks.length}</span>
              <span className="text-xs text-blue-500 dark:text-blue-400 mr-2">(برای مشاهده کلیک کنید)</span>
            </h3>
          </div>
        )}

        {showReminderModal && (
          <ReminderTasksModal 
            tasks={reminderTasks} 
            onClose={() => setShowReminderModal(false)}
          />
        )}
        
        {showOverdueModal && (
          <OverdueTasksModal 
            tasks={overdueTasks} 
            onClose={() => setShowOverdueModal(false)}
          />
        )}
        
        {showDueSoonModal && (
          <DueSoonTasksModal 
            tasks={dueSoonTasks} 
            onClose={() => setShowDueSoonModal(false)}
          />
        )}

        {(overdueTasks.length > 0 || dueSoonTasks.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {overdueTasks.length > 0 && (
              <div 
                className="bg-red-50 dark:bg-red-900/20 backdrop-blur-lg border-2 border-red-300 dark:border-red-700 rounded-2xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all hover:scale-[1.01]"
                onClick={() => setShowOverdueModal(true)}
              >
                <h3 className="text-red-700 dark:text-red-400 font-bold text-lg flex items-center gap-2">
                  ⚠️ وظایف عقب‌افتاده 
                  <span className="bg-red-500 text-white rounded-full px-3 py-1 text-sm">{overdueTasks.length}</span>
                  <span className="text-xs text-red-500 dark:text-red-400 mr-2">(برای مشاهده کلیک کنید)</span>
                </h3>
              </div>
            )}
            {dueSoonTasks.length > 0 && (
              <div 
                className="bg-yellow-50 dark:bg-yellow-900/20 backdrop-blur-lg border-2 border-yellow-300 dark:border-yellow-700 rounded-2xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all hover:scale-[1.01]"
                onClick={() => setShowDueSoonModal(true)}
              >
                <h3 className="text-yellow-700 dark:text-yellow-400 font-bold text-lg flex items-center gap-2">
                  ⏰ وظایف نزدیک به موعد 
                  <span className="bg-yellow-500 text-white rounded-full px-3 py-1 text-sm">{dueSoonTasks.length}</span>
                  <span className="text-xs text-yellow-500 dark:text-yellow-400 mr-2">(برای مشاهده کلیک کنید)</span>
                </h3>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <button onClick={() => setActiveTab('tasks')} className={`px-6 py-2 rounded-lg font-semibold transition backdrop-blur-lg ${activeTab === 'tasks' ? 'bg-blue-500 text-white shadow-lg' : `${isDark ? 'bg-dark-card text-gray-300 hover:bg-dark-border' : 'bg-white text-gray-600 hover:bg-gray-100'}`}`}>📋 وظایف</button>
          <button onClick={() => setActiveTab('folders')} className={`px-6 py-2 rounded-lg font-semibold transition backdrop-blur-lg ${activeTab === 'folders' ? 'bg-green-500 text-white shadow-lg' : `${isDark ? 'bg-dark-card text-gray-300 hover:bg-dark-border' : 'bg-white text-gray-600 hover:bg-gray-100'}`}`}>📁 پوشه‌ها</button>
          <button onClick={() => setActiveTab('notes')} className={`px-6 py-2 rounded-lg font-semibold transition backdrop-blur-lg ${activeTab === 'notes' ? 'bg-purple-500 text-white shadow-lg' : `${isDark ? 'bg-dark-card text-gray-300 hover:bg-dark-border' : 'bg-white text-gray-600 hover:bg-gray-100'}`}`}>📝 توضیحات</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} backdrop-blur-lg rounded-2xl shadow-xl p-6 md:col-span-1`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-700'} flex items-center justify-between`}>
              <span>🏢 شرکت‌ها</span>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{companies.length} شرکت</span>
            </h2>
            <div className="flex gap-2 mb-4">
              <input type="text" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="نام شرکت..." className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${isDark ? 'bg-dark-bg border-dark-border text-white' : 'bg-white border-gray-300 text-gray-800'}`} onKeyPress={(e) => e.key === 'Enter' && addCompany()} />
              <button onClick={addCompany} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition transform hover:scale-105">+</button>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {companies.map(company => (
                <div key={company.id} className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${selectedCompany?.id === company.id ? 'bg-blue-500 text-white shadow-lg' : `${isDark ? 'bg-dark-bg hover:bg-dark-border' : 'bg-gray-50 hover:bg-gray-100'} ${isDark ? 'text-gray-300' : 'text-gray-800'}`}`}>
                  <span onClick={() => { 
                    setSelectedCompany(company); 
                    fetchTasks(company.id);
                    fetchNotes(company.id);
                    fetchFolders(company.id);
                  }} className="flex-1">{company.name}</span>
                  <button onClick={() => deleteCompany(company.id)} className={`opacity-0 group-hover:opacity-100 transition ${selectedCompany?.id === company.id ? 'text-white hover:text-red-200' : 'text-red-500 hover:text-red-700'}`}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className={`md:col-span-2 ${isDark ? 'bg-dark-card' : 'bg-white'} backdrop-blur-lg rounded-2xl shadow-xl p-6`}>
            {!selectedCompany ? (
              <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-400'} py-16`}>
                <div className="text-6xl mb-4">👈</div>
                <p className="text-lg">یک شرکت را انتخاب کنید</p>
              </div>
            ) : (
              <>
                {activeTab === 'tasks' && (
                  <>
                    <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-700'} flex items-center justify-between`}>
                      <span>📋 وظایف {selectedCompany?.name && `- ${selectedCompany.name}`}</span>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{tasks.filter(t => t.is_done).length}/{tasks.length} انجام شده</span>
                    </h2>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="وظیفه جدید..." className={`flex-1 min-w-[120px] px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${isDark ? 'bg-dark-bg border-dark-border text-white' : 'bg-white border-gray-300 text-gray-800'}`} onKeyPress={(e) => e.key === 'Enter' && addTask()} />
                      
                      <select value={taskPeriod} onChange={(e) => setTaskPeriod(e.target.value)} className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${isDark ? 'bg-dark-bg border-dark-border text-white' : 'bg-white border-gray-300 text-gray-800'}`}>
                        <option value="یکبار">یکبار</option>
                        <option value="هفتگی">هفتگی</option>
                        <option value="ماهانه">ماهانه</option>
                        <option value="سالانه">سالانه</option>
                      </select>
                      
                      {taskPeriod === 'هفتگی' ? (
                        <DayPicker value={weekDay} onChange={setWeekDay} />
                      ) : (
                        <input type="text" value={dueDate} onChange={(e) => setDueDate(e.target.value)} placeholder="۱۴۰۵/۰۵/۲۷" className="px-2 py-1.5 border rounded-lg w-32 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-bg dark:text-white" />
                      )}
                      
                      <label className={`flex items-center gap-2 px-3 py-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <input type="checkbox" checked={requireUpload} onChange={(e) => setRequireUpload(e.target.checked)} className="w-4 h-4" />
                        آپلود
                      </label>
                      
                      <div className="flex items-center gap-2">
                        <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>یادآوری:</label>
                        <input type="number" value={reminderDays} onChange={(e) => setReminderDays(Number(e.target.value))} min="0" max="30" className={`w-14 px-2 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${isDark ? 'bg-dark-bg border-dark-border text-white' : 'bg-white border-gray-300 text-gray-800'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>روز قبل</span>
                      </div>
                      
                      {folders.length > 0 && (
                        <select 
                          value={selectedFolderId || ''} 
                          onChange={(e) => setSelectedFolderId(e.target.value ? Number(e.target.value) : null)}
                          className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${isDark ? 'bg-dark-bg border-dark-border text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                        >
                          <option value="">📁 بدون پوشه</option>
                          {folders.map(folder => (
                            <option key={folder.id} value={folder.id}>📁 {folder.name}</option>
                          ))}
                        </select>
                      )}
                      
                      <button onClick={addTask} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition transform hover:scale-105">افزودن</button>
                    </div>
                    
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {tasks.map(task => {
                        const taskFolder = folders.find(f => f.id === task.folder_id);
                        return (
                          <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border transition ${task.is_done ? `${isDark ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'}` : `${isDark ? 'bg-dark-bg border-dark-border' : 'bg-white border-gray-200 hover:border-blue-300'}`}`}>
                            <button onClick={() => toggleTask(task.id, task.is_done)} className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition flex-shrink-0 ${task.is_done ? 'bg-green-500 border-green-500 text-white' : `${isDark ? 'border-gray-600 hover:border-green-500' : 'border-gray-300 hover:border-green-500'}`}`}>{task.is_done && '✓'}</button>
                            <div className="flex-1 min-w-0">
                              <span className={`block ${task.is_done ? 'line-through text-gray-400 dark:text-gray-500' : isDark ? 'text-gray-300' : ''}`}>{task.title}</span>
                              {taskFolder && <span className="text-xs text-green-500 dark:text-green-400 block">📁 {taskFolder.name}</span>}
                              {task.is_done && task.done_at && <span className="text-xs text-gray-400 dark:text-gray-500 block">انجام شده در: {new Date(task.done_at).toLocaleString('fa-IR')}</span>}
                              {task.period && task.period !== 'یکبار' && !task.is_done && <span className="text-xs text-blue-500 dark:text-blue-400 block">📅 {task.period} - سررسید: {toJalaali(task.due_date)}</span>}
                              {task.reminder_days > 0 && !task.is_done && <span className="text-xs text-orange-500 dark:text-orange-400 block">🔔 {task.reminder_days} روز قبل یادآوری</span>}
                            </div>
                            {task.file_path && (
                              <button onClick={() => openFile(task.id)} className="text-blue-500 hover:text-blue-700 text-sm flex-shrink-0" title="مشاهده فایل">📎</button>
                            )}
                            {task.require_upload && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <input type="file" id={`file-${task.id}`} className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadFile(task.id, e.target.files[0]); }} />
                                <label htmlFor={`file-${task.id}`} className="text-blue-500 hover:text-blue-700 cursor-pointer text-sm px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition" title="آپلود فایل">📤</label>
                              </div>
                            )}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => {
                                  setSelectedTaskForCopy(task);
                                  setCopyModalOpen(true);
                                }}
                                className="text-purple-500 hover:text-purple-700 text-sm px-2 py-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
                                title="کپی به شرکت‌های دیگر"
                              >
                                📋
                              </button>
                              {task.due_date && (
                                <button onClick={() => addToTaskScheduler(task.id)} className="text-purple-500 hover:text-purple-700 text-sm px-2 py-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20 transition" title="افزودن به Task Scheduler">⏰</button>
                              )}
                              <button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-600 transition text-sm px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">🗑</button>
                            </div>
                          </div>
                        );
                      })}
                      {tasks.length === 0 && <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-400'} py-8`}><div className="text-4xl mb-2">📝</div><p>هیچ وظیفه‌ای ثبت نشده است</p></div>}
                    </div>
                  </>
                )}

                {activeTab === 'folders' && (
                  <>
                    <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-700'} flex items-center justify-between`}>
                      <span>📁 پوشه‌های {selectedCompany.name}</span>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{folders.length} پوشه</span>
                    </h2>
                    
                    <div className="flex gap-2 mb-4">
                      <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="نام پوشه جدید..." className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${isDark ? 'bg-dark-bg border-dark-border text-white' : 'bg-white border-gray-300 text-gray-800'}`} onKeyPress={(e) => e.key === 'Enter' && addFolder()} />
                      <button onClick={addFolder} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition transform hover:scale-105">ساخت پوشه</button>
                    </div>
                    
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {folders.map(folder => (
                        <div key={folder.id} className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? 'bg-dark-bg border-dark-border' : 'bg-white border-gray-200'} hover:shadow-md transition`}>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📁</span>
                            <div>
                              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{folder.name}</span>
                              <span className={`text-xs block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                ساخته شده: {moment(folder.created_at).format('jYYYY/jMM/jDD HH:mm')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedFolderForCopy(folder);
                                setCopyFolderModalOpen(true);
                              }}
                              className="text-purple-500 hover:text-purple-700 text-sm px-2 py-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
                              title="کپی پوشه به شرکت‌های دیگر"
                            >
                              📋 کپی
                            </button>
                            <button
                              onClick={() => deleteFolder(folder.id)}
                              className="text-red-400 hover:text-red-600 transition text-sm px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              🗑
                            </button>
                          </div>
                        </div>
                      ))}
                      {folders.length === 0 && <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-400'} py-8`}><div className="text-4xl mb-2">📁</div><p>هیچ پوشه‌ای ساخته نشده است</p><p className="text-sm">با استفاده از فرم بالا پوشه جدید بسازید</p></div>}
                    </div>
                  </>
                )}

                {activeTab === 'notes' && (
                  <>
                    <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-700'} flex items-center justify-between`}>
                      <span>📝 توضیحات {selectedCompany.name}</span>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{notes.length} مورد</span>
                    </h2>
                    
                    <div className="bg-gray-50 dark:bg-dark-bg/50 rounded-xl p-4 mb-4 space-y-3">
                      <div className="flex flex-wrap gap-3">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="🔍 جستجو در عنوان و متن توضیحات..."
                          className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-dark-card dark:text-white"
                        />
                        
                        <select
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value)}
                          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-dark-card dark:text-white"
                        >
                          <option value="all">📅 همه زمان‌ها</option>
                          <option value="30days">📅 ۳۰ روز اخیر</option>
                          <option value="90days">📅 ۹۰ روز اخیر</option>
                          <option value="thisyear">📅 امسال</option>
                        </select>
                        
                        {folders.length > 0 && (
                          <select
                            value={folderFilter}
                            onChange={(e) => setFolderFilter(e.target.value)}
                            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-dark-card dark:text-white"
                          >
                            <option value="all">📁 همه پوشه‌ها</option>
                            {folders.map(f => (
                              <option key={f.id} value={f.id}>📁 {f.name}</option>
                            ))}
                          </select>
                        )}
                        
                        <select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value)}
                          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-dark-card dark:text-white"
                        >
                          <option value="newest">🔽 جدیدترین</option>
                          <option value="oldest">🔼 قدیمی‌ترین</option>
                        </select>
                      </div>
                      
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        نمایش {filteredNotes.length} مورد از {notes.length} توضیح
                        {searchTerm && ` - جستجو: "${searchTerm}"`}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-dark-bg rounded-xl p-4 mb-4">
                      <div className="mb-3">
                        <input
                          type="text"
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          placeholder="عنوان توضیح..."
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-dark-card dark:text-white"
                        />
                      </div>
                      <div className="mb-3">
                        <textarea
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="متن توضیح..."
                          rows="4"
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-dark-card dark:text-white resize-none"
                        />
                      </div>
                      
                      {folders.length > 0 && (
                        <div className="mb-3">
                          <select 
                            value={noteFolderId || ''} 
                            onChange={(e) => setNoteFolderId(e.target.value ? Number(e.target.value) : null)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-dark-card dark:text-white"
                          >
                            <option value="">📁 بدون پوشه</option>
                            {folders.map(folder => (
                              <option key={folder.id} value={folder.id}>📁 {folder.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      <div className="mb-3">
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <input 
                            type="checkbox" 
                            checked={renameNoteFiles} 
                            onChange={(e) => setRenameNoteFiles(e.target.checked)} 
                            className="w-4 h-4" 
                          />
                          🔄 تغییر نام فایل‌ها با عنوان توضیح
                        </label>
                      </div>
                      
                      <div className="flex gap-2 flex-wrap">
                        <input
                          type="file"
                          id="noteFile"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const filesArray = Array.from(e.target.files);
                              setNoteFiles([...noteFiles, ...filesArray]);
                            }
                          }}
                        />
                        <label
                          htmlFor="noteFile"
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                        >
                          📎 افزودن چند فایل
                        </label>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          (می‌توانید چند فایل همزمان انتخاب کنید)
                        </span>
                        {noteFiles.length > 0 && (
                          <div className="flex flex-wrap gap-2 w-full mt-2">
                            {noteFiles.map((file, index) => (
                              <span key={index} className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded flex items-center gap-1">
                                📄 {file.name}
                                <button
                                  onClick={() => removeFileFromNote(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                            <span className="text-xs text-green-600 dark:text-green-400 flex items-center">
                              {noteFiles.length} فایل انتخاب شده
                            </span>
                          </div>
                        )}
                        <button
                          onClick={addNote}
                          className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                          disabled={loading}
                        >
                          {loading ? '⏳ در حال ذخیره...' : '💾 ذخیره'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {filteredNotes.map(note => {
                        const files = note.files && Array.isArray(note.files) ? note.files : [];
                        const noteFolder = folders.find(f => f.id === note.folder_id);
                        const isExpanded = expandedNotes[note.id] || false;
                        
                        return (
                          <div key={note.id} className={`p-3 rounded-lg border transition ${isDark ? 'bg-dark-bg border-dark-border' : 'bg-white border-gray-200'} hover:shadow-md`}>
                            <div 
                              className="flex items-start justify-between cursor-pointer"
                              onClick={() => toggleNoteExpand(note.id)}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{isExpanded ? '📂' : '📁'}</span>
                                  <h4 className={`font-bold truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{note.title}</h4>
                                </div>
                                {noteFolder && (
                                  <span className="text-xs text-green-500 dark:text-green-400 block">📁 {noteFolder.name}</span>
                                )}
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                                  <span>📅 {moment(note.created_at).format('jYYYY/jMM/jDD HH:mm')}</span>
                                  <span>🏢 {selectedCompany?.name}</span>
                                  {files.length > 0 && (
                                    <span className="text-blue-500">📎 {files.length} فایل</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-gray-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{note.content}</p>
                                
                                {files.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {files.map((file, idx) => {
                                      if (!file) return null;
                                      const filename = file.split('/').pop() || 'فایل';
                                      return (
                                        <div key={idx} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                                          <button
                                            onClick={() => openNoteFile(file)}
                                            className="text-blue-500 hover:text-blue-700"
                                          >
                                            📄 {filename}
                                          </button>
                                          <button
                                            onClick={() => deleteNoteFile(note.id, idx)}
                                            className="text-red-400 hover:text-red-600"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      );
                                    })}
                                    {files.length > 1 && (
                                      <button
                                        onClick={() => downloadFilesAsZip(note.id, note.title)}
                                        className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded text-xs hover:bg-green-200 dark:hover:bg-green-900/50 transition"
                                      >
                                        📦 دانلود همه به صورت ZIP
                                      </button>
                                    )}
                                  </div>
                                )}
                                
                                <div className="flex gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                  <button
                                    onClick={() => openEditModal(note)}
                                    className="text-blue-500 hover:text-blue-700 text-sm px-3 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                                  >
                                    ✏️ ویرایش
                                  </button>
                                  <button
                                    onClick={() => deleteNote(note.id)}
                                    className="text-red-500 hover:text-red-700 text-sm px-3 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                  >
                                    🗑 حذف
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {filteredNotes.length === 0 && (
                        <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-400'} py-8`}>
                          <div className="text-4xl mb-2">📝</div>
                          <p>هیچ توضیحی برای این شرکت ثبت نشده است</p>
                          <p className="text-sm">با استفاده از فرم بالا توضیح جدید اضافه کنید</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {copyModalOpen && selectedTaskForCopy && (
        <CopyTaskModal
          task={selectedTaskForCopy}
          companies={companies.filter(c => c.id !== selectedTaskForCopy.company_id)}
          onClose={() => {
            setCopyModalOpen(false);
            setSelectedTaskForCopy(null);
          }}
          onCopy={(companyIds) => copyTask(selectedTaskForCopy.id, companyIds)}
        />
      )}
      
      {copyFolderModalOpen && selectedFolderForCopy && (
        <CopyFolderModal
          folder={selectedFolderForCopy}
          companies={companies.filter(c => c.id !== selectedFolderForCopy.company_id)}
          onClose={() => {
            setCopyFolderModalOpen(false);
            setSelectedFolderForCopy(null);
          }}
          onCopy={(companyIds) => copyFolder(selectedFolderForCopy.id, companyIds)}
        />
      )}
      
      {showEditModal && editingNote && (
        <EditNoteModal
          note={editingNote}
          folders={folders}
          onClose={() => {
            setShowEditModal(false);
            setEditingNote(null);
          }}
          onSave={handleNoteUpdate}
        />
      )}
    </div>
  );
}

export default App;
