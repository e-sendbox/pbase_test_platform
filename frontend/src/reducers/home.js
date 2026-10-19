import { HOME_PAGE_LOADED, HOME_PAGE_UNLOADED } from '../constants/actionTypes';

export default (state = {}, action) => {
  switch (action.type) {
    case HOME_PAGE_LOADED: {
      const tagsPayload = action.payload && action.payload[0];
      if (!tagsPayload) {
        return state;
      }
      return {
        ...state,
        tags: tagsPayload.tags
      };
    }
    case HOME_PAGE_UNLOADED:
      return {};
    default:
      return state;
  }
};
