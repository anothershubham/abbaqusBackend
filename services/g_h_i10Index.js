exports.indexing = function (params) {
    function quickSort(arr, left, right) {
        var len = arr.length,
            pivot,
            partitionIndex;


        if (left < right) {
            pivot = right;
            partitionIndex = partition(arr, pivot, left, right);

            //sort left and right
            quickSort(arr, left, partitionIndex - 1);
            quickSort(arr, partitionIndex + 1, right);
        }
        return arr;
    }

    function partition(arr, pivot, left, right) {
        var pivotValue = arr[pivot],
            partitionIndex = left;

        for (var i = left; i < right; i++) {
            if (arr[i] < pivotValue) {
                swap(arr, i, partitionIndex);
                partitionIndex++;
            }
        }
        swap(arr, right, partitionIndex);
        return partitionIndex;
    }

    function swap(arr, i, j) {
        var temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }

    let ciatationArray = quickSort(params,0,(params.length-1));
    ciatationArray = ciatationArray.reverse();

    function indexingCount(cit) {
        var gCount = 0;
        var hCount = 0;
        var i10Count = 0;
        var sum = 0;
        var mid = cit.length / 2;

        // i10 index
        if (cit[mid] >= 10) {
            for (let i = mid + 1; i < cit.length; i++) {
                if (cit[i] >= 10)
                    i10Count++;
                else
                    break;
            }
            i10Count = i10Count + mid + 1;
        }
        else {
            for (let i = 0; i < mid; i++) {
                if (cit[i] >= 10)
                    i10Count++;
                else
                    break;
            }
        }

        //g index 
        for (var i = 0; i < cit.length; i++) {
            sum = sum + cit[i];
            if (sum >= Math.pow((i + 1), 2) && cit[i] > 0)
                gCount++;
            else
                break;
        }

        // h index
        if (cit[mid] >= mid) {
            for (let i = mid + 1; i < cit.length; i++) {
                if (cit[i] >= i + 1)
                    hCount++;
                else
                    break;
            }
            hCount = hCount + mid + 1;
        }
        else {
            for (let i = 0; i < mid; i++) {
                if (cit[i] >= i + 1)
                    hCount++;
                else
                    break;
            }
        } 

        return { gCount: gCount, hCount: hCount, i10Count: i10Count };
    }
    
    return indexingCount(ciatationArray);
}