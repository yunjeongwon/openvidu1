import PropTypes from 'prop-types';
import ParticipantListItem from './ParticipantListItem';

const ParticipantList = ({ subscribers, session }) => {
  return (
    <div>
      {session && subscribers && subscribers.filter((sub) => sub.stream.typeOfVideo === 'CAMERA').map((subscriber, idx) => {
        return (
          <div key={`${idx * 1}`}>
            <ParticipantListItem subscriber={subscriber} session={session} />
          </div>
        );
      })}
    </div>
  );
};

ParticipantList.propTypes = {
  subscribers: PropTypes.array.isRequired,
  session: PropTypes.object.isRequired,
};

export default ParticipantList;
