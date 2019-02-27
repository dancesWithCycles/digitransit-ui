import sinon from 'sinon';

import * as utils from '../../../app/util/mapIconUtils';
import { AlertEffectType } from '../../../app/constants';

describe('mapIconUtils', () => {
  describe('drawRoundIcon', () => {
    it('should return the icon radius', () => {
      const tile = {
        coords: {
          z: 12,
        },
        ctx: {
          arc: sinon.stub(),
          beginPath: sinon.stub(),
          fill: sinon.stub(),
        },
        ratio: 1,
      };
      const geometry = {
        x: 1,
        y: 1,
      };
      const { iconRadius } = utils.drawRoundIcon(
        tile,
        geometry,
        'BUS',
        false,
        undefined,
      );
      expect(iconRadius).to.equal(1);
    });
  });

  describe('drawRoundIconAlertBadge', () => {
    let tile;
    let getImageStub;

    beforeEach(() => {
      tile = {
        ctx: {
          arc: sinon.stub(),
          beginPath: sinon.stub(),
          drawImage: sinon.stub(),
          fill: sinon.stub(),
        },
      };
      getImageStub = sinon.stub();
    });

    it('should not draw anything if alertEffect is falsy', () => {
      utils.drawRoundIconAlertBadge(tile, {}, 1, undefined, getImageStub);
      expect(tile.ctx.drawImage.called).to.equal(false);
    });

    it('should retrieve the right icon for caution and draw the badge', async () => {
      await utils.drawRoundIconAlertBadge(
        tile,
        {},
        10,
        AlertEffectType.NoService,
        getImageStub,
      );
      expect(getImageStub.calledOnce).to.equal(true);
      expect(getImageStub.args[0][0]).to.contain('caution-badge-with-halo');
      expect(tile.ctx.arc.called).to.equal(false);
      expect(tile.ctx.beginPath.called).to.equal(false);
      expect(tile.ctx.drawImage.called).to.equal(true);
      expect(tile.ctx.fill.called).to.equal(false);
    });

    it('should retrieve the right icon for info and draw the badge', async () => {
      await utils.drawRoundIconAlertBadge(
        tile,
        {},
        10,
        AlertEffectType.Unknown,
        getImageStub,
      );
      expect(getImageStub.calledOnce).to.equal(true);
      expect(getImageStub.args[0][0]).to.contain('info');
      expect(tile.ctx.arc.called).to.equal(true);
      expect(tile.ctx.beginPath.called).to.equal(true);
      expect(tile.ctx.drawImage.called).to.equal(true);
      expect(tile.ctx.fill.called).to.equal(true);
    });

    it('should draw a circle for the info icon', () => {});
  });
});
