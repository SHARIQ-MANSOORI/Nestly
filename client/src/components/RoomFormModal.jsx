import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

const commonRoomAmenities = [
  'Free Wi-Fi',
  'Air Conditioning',
  'Smart TV',
  'Mini Bar',
  'Marble Bathroom',
  'Garden View',
  'City View',
  'Ocean View',
  'Private Jacuzzi',
  'Work Desk',
  'Nespresso Machine',
];

const RoomFormModal = ({ isOpen, onClose, onSubmit, initialRoom, isEditing }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('Deluxe');
  const [pricePerNight, setPricePerNight] = useState(3500);
  const [capacity, setCapacity] = useState(2);
  const [totalRooms, setTotalRooms] = useState(10);
  const [description, setDescription] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('available');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialRoom && isEditing) {
      setName(initialRoom.name || '');
      setType(initialRoom.type || 'Deluxe');
      setPricePerNight(initialRoom.pricePerNight || 3500);
      setCapacity(initialRoom.capacity || 2);
      setTotalRooms(initialRoom.totalRooms || 10);
      setDescription(initialRoom.description || '');
      setSelectedAmenities(initialRoom.amenities || []);
      setImageUrl(initialRoom.images && initialRoom.images.length > 0 ? initialRoom.images[0] : '');
      setStatus(initialRoom.status || 'available');
    } else {
      setName('');
      setType('Deluxe');
      setPricePerNight(3500);
      setCapacity(2);
      setTotalRooms(10);
      setDescription('');
      setSelectedAmenities(['Free Wi-Fi', 'Air Conditioning']);
      setImageUrl('https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800');
      setStatus('available');
    }
  }, [initialRoom, isEditing, isOpen]);

  if (!isOpen) return null;

  const toggleAmenity = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !description || !pricePerNight || !capacity) {
      setError('Please fill in all required room fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        name,
        type,
        pricePerNight: Number(pricePerNight),
        capacity: Number(capacity),
        totalRooms: Number(totalRooms),
        description,
        amenities: selectedAmenities,
        images: imageUrl ? [imageUrl] : [],
        status,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save room details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Edit Room Specification' : 'Add New Room Package'}
            </h3>
            <p className="text-xs text-slate-500">Configure pricing, capacity, and amenities</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Room Name */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Room Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Deluxe Ocean Suite"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Room Type */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Room Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Standard">Standard</option>
                <option value="Deluxe">Deluxe</option>
                <option value="Executive Suite">Executive Suite</option>
                <option value="Presidential Suite">Presidential Suite</option>
                <option value="Family Room">Family Room</option>
                <option value="Villa">Villa</option>
              </select>
            </div>

            {/* Price Per Night */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Price Per Night (₹)</label>
              <input
                type="number"
                required
                min="0"
                step="100"
                value={pricePerNight}
                onChange={(e) => setPricePerNight(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Guest Capacity */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Guest Capacity</label>
              <input
                type="number"
                required
                min="1"
                max="10"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Total Rooms */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Inventory Units</label>
              <input
                type="number"
                min="1"
                value={totalRooms}
                onChange={(e) => setTotalRooms(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Room Status */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Availability Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="available">Available (Public)</option>
                <option value="maintenance">Under Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Room Description</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe room features, bed type, layout, view, etc."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Image URL */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Room Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Room Amenities Chips */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Select Room Amenities</label>
            <div className="flex flex-wrap gap-1.5">
              {commonRoomAmenities.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    <span>{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-75"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Room' : 'Save Room Package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomFormModal;
