import React, { ChangeEvent, FC, memo, useCallback, useEffect, useState } from 'react';
import { Handle, Position } from 'reactflow';
import NodeWrapper from '../NodeWrapper/NodeWrapper';
import { useAppDispatch } from '@/app/hooks';
import { ICodeNode } from '@/redux/flowSlice/interface';
import s from './CodeNode.module.scss'
import { flowActions } from '@/redux/flowSlice/flowSlice';
import { classNames } from '@/utils';
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

type CodeNodeProps = {
    data: ICodeNode
}

const CodeNode: FC<CodeNodeProps> = memo(({ data }) => {

    const dispatch = useAppDispatch()
    const [isDoubleClick, setIsDoubleClick] = useState(false);
    const [v, setV] = useState<string>('')

    const onChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.currentTarget.value
        setV(_ => value)
    }, [v])

    const handleDoubleClick = () => {
        setIsDoubleClick(true)
    }

    useEffect(() => {
        if (data?.value) {
            setV(_ => data.value)
        }
    }, [data.value])

    return (
        <NodeWrapper onDoubleClick={handleDoubleClick} isDoubleClick={isDoubleClick} setIsDoubleClick={setIsDoubleClick}>
            <Handle
                type="target"
                position={Position.Left}
                onConnect={(params) => console.log('handle onConnect', params)}
            />
            <div className={classNames(s.container)}>
                {isDoubleClick ? (
                    <>
                        <div className={classNames(
                            '',
                            { [s.inputWrapper]: data.isWrapped },
                            []
                        )}>
                    <textarea
                        rows={data.isWrapped
                            ? 1
                            : v.split('\n').length
                        }
                        className={classNames(s.codeInput)}
                        value={v}
                        onBlur={(e) => dispatch(flowActions.onCodeNodeChange({ id: data.id, key: 'value', value: e.currentTarget.value }))}
                        onChange={onChange}
                    />
                        </div>
                        <button
                            className={s.wrapButton}
                            onClick={() => dispatch(flowActions.onCodeNodeChange({ id: data.id, key: 'isWrapped', value: !data.isWrapped }))}
                        >{data.isWrapped ? <IoIosArrowDown /> : <IoIosArrowUp />}</button>
                    </>
                ): (
                    <div>{v}</div>
                )}
            </div>
            <Handle
                type="source"
                position={Position.Right}
                id="a"
            />
        </NodeWrapper>
    );
});
CodeNode.displayName = 'CodeNode'

export default CodeNode