import React, { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ModalWrapper from '@/components/ModalWrapper/ModalWrapper';
import styles from './styles.module.scss';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { useDispatch } from 'react-redux';
import { flowActions } from '@/redux/flow/slice/flowSlice';
import { classNames } from '@/utils';
import { NodeMenu } from './NodeMenu/NodeMenu';
import { useAppSelector } from '@/app/hooks';

type NodeWrapperProps = {
  isDoubleClick: boolean;
  id: string;
  children?: React.ReactNode;
  onDoubleClick?: () => void;
};

const NodeWrapper: FC<NodeWrapperProps> = memo(({ children, onDoubleClick, isDoubleClick, id }) => {
  const [isModal, setIsModal] = useState(false);
  const ref = useRef(null);
  const dispatch = useDispatch();
  const { selectedNodes } = useAppSelector((state) => state.flow);

  const isSelected = useMemo<boolean>(() => {
    return selectedNodes.includes(id);
  }, [selectedNodes]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.code === 'Delete') {
        dispatch(flowActions.onDeleteNode(id));
      }
    },
    [id],
  );

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    switch (e.detail) {
      case 1: {
        if (isSelected) dispatch(flowActions.onReleaseNode(id));
        else dispatch(flowActions.onSelectNode(id));
        break;
      }

      case 2:
        onDoubleClick();
    }
  };

  return (
    <div ref={ref} onClick={handleClick} className={styles.node_wrapper} tabIndex={0} onKeyDown={onKeyDown}>
      {isModal && <ModalWrapper />}
      <div className={classNames(styles.node_wrapper_container, { [styles.focused]: isSelected }, [])}>
        {isSelected && <NodeMenu nodeId={id} />}
        <div className={styles.node_wrapper_children_container}>{children}</div>
        <BsThreeDotsVertical onClick={() => setIsModal(!isModal)} />
      </div>
    </div>
  );
});
NodeWrapper.displayName = 'NodeWrapper';
export default NodeWrapper;
