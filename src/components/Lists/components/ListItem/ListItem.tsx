import { useCallback } from 'react';
import styles from './styles.module.scss';
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { FaCheck } from "react-icons/fa";
import { listActions } from '@/redux/list/listSlice';
import { batch } from 'react-redux';
import { dtoToFlow } from '@/redux/flow/flowUtils';
import { flowActions } from '@/redux/flow/slice/flowSlice';

interface ListItemProps {
    itemId: string;
    name: string;
    setIsOpen: (e: boolean) => void;
}
const ListItem = ({ itemId, name, setIsOpen }: ListItemProps) => {
    const { id, pages } = useAppSelector(state => state.list);
    const dispatch = useAppDispatch();
    const flowState = useAppSelector(s => s.flow)

    const onClick = useCallback(() => {
        batch(() => {
            dispatch(listActions.changePage({ newID: itemId, flowState: flowState }))
            dispatch(flowActions.onUpdateState(dtoToFlow(pages.find(page => page.id === itemId))))
        })
        setIsOpen(false)
    }, [])

    return (
        <div
            onClick={onClick}
            className={styles.list_item}
        >
            <div>{name}</div>
            {itemId === id && <FaCheck style={{ marginLeft: '5px' }} fill={'green'} />}
        </div>
    );
};

export default ListItem;