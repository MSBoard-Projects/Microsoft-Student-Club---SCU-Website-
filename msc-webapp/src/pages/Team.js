import React, { useState, useEffect } from 'react';
import { membersApi } from '../services/api';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const Team = () => {
  const [highBoard, setHighBoard] = useState([]);
  const [board, setBoard] = useState([]);
  const [goldenMembers, setGoldenMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch members on mount
  useEffect(() => {
    fetchMembers();
  }, []);

  // Fetch all members by type
  const fetchMembers = async () => {
    setLoading(true);
    setError('');
    try {
      const [highBoardData, boardData, goldenMembersData] = await Promise.all([
        membersApi.getByType('High Board'),
        membersApi.getByType('Board'),
        membersApi.getByType('Golden Member')
      ]);
      setHighBoard(highBoardData);
      setBoard(boardData);
      setGoldenMembers(goldenMembersData);
    } catch (err) {
      console.error('Failed to fetch members:', err);
      setError('Failed to load team members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render member card
  const renderMemberCard = (member) => (
    <Card key={member.id}>
      {member.imageUrl && (
        <div className="mb-4">
          <img 
            src={member.imageUrl} 
            alt={member.fullName}
            className="w-full h-64 object-cover rounded-md"
          />
        </div>
      )}
      <h3 className="text-xl font-bold text-navy mb-1">{member.fullName}</h3>
      <p className="text-sm text-gray-600 mb-3">{member.positionTitle}</p>
      
      {member.email && (
        <p className="text-xs text-gray-500 mb-1">📧 {member.email}</p>
      )}
      
      {member.phoneNumber && (
        <p className="text-xs text-gray-500 mb-3">📱 {member.phoneNumber}</p>
      )}
      
      {member.certificateUrl && (
        <a 
          href={member.certificateUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline inline-block"
        >
          View Certificate →
        </a>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-background-white">
      {/* Header */}
      <section className="bg-navy text-text-light py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Our Team</h1>
          <p className="text-xl">
            Meet the dedicated members driving innovation at MSC-SCU
          </p>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="container mx-auto px-4 mt-6">
          <ErrorMessage message={error} onRetry={fetchMembers} />
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" text="Loading team members..." />
        </div>
      ) : (
        <section className="py-16">
          <div className="container mx-auto px-4">
            {/* High Board */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-navy mb-6 text-center">
                High Board
              </h2>
              {highBoard.length === 0 ? (
                <p className="text-center text-gray-500">No High Board members at the moment.</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {highBoard.map(renderMemberCard)}
                </div>
              )}
            </div>

            {/* Board Members */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-navy mb-6 text-center">
                Board Members
              </h2>
              {board.length === 0 ? (
                <p className="text-center text-gray-500">No Board members at the moment.</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {board.map(renderMemberCard)}
                </div>
              )}
            </div>

            {/* Golden Members */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-navy mb-6 text-center">
                Golden Members
              </h2>
              {goldenMembers.length === 0 ? (
                <p className="text-center text-gray-500">No Golden members at the moment.</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {goldenMembers.map(renderMemberCard)}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Team;
