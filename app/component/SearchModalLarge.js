import React from 'react';
import Tabs from 'material-ui/Tabs/Tabs';

import Icon from './Icon';
import config from '../config';


const SearchModal = ({ modalIsOpen, closeModal, selectedTab, children }) => {
  if (!modalIsOpen) {
    return false;
  }
  return (
    <div>
      <div className="search-modal-overlay" onClick={closeModal} />
      <div className="search-modal-container">
        <div className="search-modal">
          <div className="cursor-pointer search-header">
            <Tabs
              className="search-header__tabs-root"
              inkBarStyle={{
                backgroundColor: config.colors.primary,
                height: '4px',
              }}
              value={selectedTab}
            >{children}</Tabs>
            <div className="closeSearchButton" id="closeSearchButton" onClick={closeModal}>
              <Icon img="icon-icon_close" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

SearchModal.propTypes = {
  modalIsOpen: React.PropTypes.bool.isRequired,
  closeModal: React.PropTypes.func.isRequired,
  selectedTab: React.PropTypes.string.isRequired,
  children: React.PropTypes.node,
};

export default SearchModal;
