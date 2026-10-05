import { useState, useEffect } from 'react';
import { useInventory } from '../hooks/useInventory';
import { useSales } from '../hooks/useSales';
import { getAllFromStore, STORES } from '../services/db';
import './BusinessTracker.css';

export default function BusinessTracker() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [perfumes, setPerfumes] = useState([]);
  const { inventory, updateInventoryItem } = useInventory();
  const { sales, recordSale, removeSale } = useSales();

  useEffect(() => {
    async function loadCatalog() {
      const data = await getAllFromStore(STORES.PERFUMES);
      setPerfumes(data || []);
    }
    loadCatalog();
  }, []);

  const getPerfumeName = (id) => {
    const p = perfumes.find(p => p.id === id);
    return p ? p.name : 'Unknown Perfume';
  };

  const getInventoryForPerfume = (id) => {
    return inventory.find(i => i.perfume_id === id) || { stock_quantity: 0, cost_price: 0, selling_price: 0 };
  };

  return (
    <div className="business-tracker w-full max-w-4xl mx-auto mt-8">
      <div className="tracker-nav tabs-header justify-center mb-6">
        <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
        <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>Inventory</button>
        <button className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>Sales</button>
      </div>

      <div className="tracker-content glass-panel" style={{maxWidth: '100%'}}>
        {activeTab === 'dashboard' && <DashboardTab sales={sales} />}
        {activeTab === 'inventory' && (
          <InventoryTab 
            perfumes={perfumes} 
            getInventory={getInventoryForPerfume} 
            updateInventory={updateInventoryItem} 
          />
        )}
        {activeTab === 'sales' && (
          <SalesTab 
            perfumes={perfumes}
            sales={sales}
            getInventory={getInventoryForPerfume}
            recordSale={recordSale}
            removeSale={removeSale}
            getPerfumeName={getPerfumeName}
          />
        )}
      </div>
    </div>
  );
}

function DashboardTab({ sales }) {
  const today = new Date().toISOString().slice(0,10);
  const todaySales = sales.filter(s => s.date.startsWith(today));
  
  const totalRevenue = sales.reduce((sum, s) => sum + (s.selling_price * s.quantity), 0);
  const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
  const itemsSold = sales.reduce((sum, s) => sum + s.quantity, 0);

  const todayRevenue = todaySales.reduce((sum, s) => sum + (s.selling_price * s.quantity), 0);
  const todayProfit = todaySales.reduce((sum, s) => sum + s.profit, 0);

  return (
    <div className="dashboard-tab">
      <h2 className="section-title">Business Dashboard</h2>
      <div className="metrics-grid">
        <div className="metric-card">
          <h4>Today's Revenue</h4>
          <p className="metric-value">₦{todayRevenue.toLocaleString()}</p>
        </div>
        <div className="metric-card highlight-card">
          <h4>Today's Profit</h4>
          <p className="metric-value profit">₦{todayProfit.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <h4>Total Revenue</h4>
          <p className="metric-value">₦{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <h4>Total Profit</h4>
          <p className="metric-value profit">₦{totalProfit.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <h4>Total Items Sold</h4>
          <p className="metric-value">{itemsSold}</p>
        </div>
      </div>
    </div>
  );
}

function InventoryTab({ perfumes, getInventory, updateInventory }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ stock_quantity: 0, cost_price: 0, selling_price: 0 });

  const filtered = perfumes.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const startEdit = (p) => {
    const inv = getInventory(p.id);
    setEditingId(p.id);
    setEditForm({
      stock_quantity: inv.stock_quantity || 0,
      cost_price: inv.cost_price || 0,
      selling_price: inv.selling_price || 0
    });
  };

  const saveEdit = async () => {
    await updateInventory(editingId, editForm.stock_quantity, editForm.cost_price, editForm.selling_price);
    setEditingId(null);
  };

  return (
    <div className="inventory-tab">
      <h2 className="section-title">Inventory Management</h2>
      <div className="search-container mb-4">
        <input 
          type="text" 
          placeholder="Search perfumes..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)}
          className="form-input w-full"
        />
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Perfume</th>
              <th>Stock</th>
              <th>Cost (₦)</th>
              <th>Selling (₦)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map(p => {
              const inv = getInventory(p.id);
              const isEditing = editingId === p.id;
              
              return (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>
                    {isEditing ? 
                      <input type="number" className="form-input small" value={editForm.stock_quantity} onChange={e => setEditForm({...editForm, stock_quantity: e.target.value})} /> 
                      : <span className={`stock-badge ${inv.stock_quantity <= 0 ? 'out-of-stock' : (inv.stock_quantity < 5 ? 'low-stock' : '')}`}>{inv.stock_quantity || 0}</span>
                    }
                  </td>
                  <td>
                    {isEditing ? 
                      <input type="number" className="form-input small" value={editForm.cost_price} onChange={e => setEditForm({...editForm, cost_price: e.target.value})} /> 
                      : (inv.cost_price || 0).toLocaleString()
                    }
                  </td>
                  <td>
                    {isEditing ? 
                      <input type="number" className="form-input small" value={editForm.selling_price} onChange={e => setEditForm({...editForm, selling_price: e.target.value})} /> 
                      : (inv.selling_price || 0).toLocaleString()
                    }
                  </td>
                  <td>
                    {isEditing ? (
                      <button className="btn-small save-btn" onClick={saveEdit}>Save</button>
                    ) : (
                      <button className="btn-small edit-btn" onClick={() => startEdit(p)}>Edit</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length > 50 && <p className="text-muted text-center mt-2">Showing first 50 results...</p>}
      </div>
    </div>
  );
}

function SalesTab({ perfumes, sales, getInventory, recordSale, removeSale, getPerfumeName }) {
  const [form, setForm] = useState({ perfume_id: '', quantity: 1, selling_price: '', cost_price: '' });

  const handlePerfumeSelect = (e) => {
    const id = Number(e.target.value);
    if (!id) {
      setForm({ perfume_id: '', quantity: 1, selling_price: '', cost_price: '' });
      return;
    }
    const inv = getInventory(id);
    setForm({
      ...form,
      perfume_id: id,
      selling_price: inv.selling_price || '',
      cost_price: inv.cost_price || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.perfume_id) return;
    
    await recordSale(form.perfume_id, form.quantity, form.selling_price, form.cost_price);
    setForm({ perfume_id: '', quantity: 1, selling_price: '', cost_price: '' });
  };

  return (
    <div className="sales-tab">
      <h2 className="section-title">Record a Sale</h2>
      <form onSubmit={handleSubmit} className="sales-form">
        <select value={form.perfume_id} onChange={handlePerfumeSelect} className="form-input" required>
          <option value="">Select Perfume...</option>
          {perfumes.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        
        <input 
          type="number" 
          placeholder="Qty" 
          className="form-input"
          value={form.quantity} 
          onChange={e => setForm({...form, quantity: e.target.value})} 
          min="1" required 
        />
        
        <input 
          type="number" 
          placeholder="Selling Price (₦)" 
          className="form-input"
          value={form.selling_price} 
          onChange={e => setForm({...form, selling_price: e.target.value})} 
          required 
        />
        
        <input 
          type="number" 
          placeholder="Cost Price (₦)" 
          className="form-input"
          value={form.cost_price} 
          onChange={e => setForm({...form, cost_price: e.target.value})} 
          required 
        />
        
        <button type="submit" className="btn-primary">Log Sale</button>
      </form>

      <h3 className="section-title mt-8 mb-4">Recent Sales</h3>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Perfume</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Profit</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 && (
              <tr><td colSpan="6" className="text-center text-muted">No sales recorded yet.</td></tr>
            )}
            {sales.slice(0, 20).map(s => (
              <tr key={s.id}>
                <td>{new Date(s.date).toLocaleDateString()}</td>
                <td>{getPerfumeName(s.perfume_id)}</td>
                <td>{s.quantity}</td>
                <td>₦{s.selling_price.toLocaleString()}</td>
                <td className="profit-text">₦{s.profit.toLocaleString()}</td>
                <td>
                  <button className="btn-small delete-btn" onClick={() => removeSale(s.id)}>Undo</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
