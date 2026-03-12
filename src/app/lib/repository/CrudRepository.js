class CrudRepository {
  constructor(model) {
    this.model = model;
  }

  
  async create(data) {
    try {
      const result = await this.model.create(data);
      return result;
    } catch (error) {
      ////console.log(error.message)
      throw error;
    }
  }

  async destroy(id) {
    try {
      // ////console.log('iddcfvghju',id);
      const result = await this.model.findByIdAndUpdate({ _id: id }, { deletedAt: new Date(), deleted: true });
      return result;
      ////console.log('result',result);
    } catch (error) {
      throw error;
    }
  }
  

  async get(id, populateFields = []) {
    try {
      ////console.log('hello',id);
      
      let result = await this.model.findById(id);
      
      if (result.plan && result.reviews){
        result = await this.model.findById(id).populate("plan").populate("reviews");
      }

      if (populateFields?.length > 0) {
        result = await this.model.findById(id).populate(populateFields);
      }
      
      ////console.log('result',result);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getALL() {
    try {
      const result = await this.model.find();
      return result;
    } catch (error) {
      throw error;
    }
  }

 

  async getAll(filterCon = {}, sortCon = {}, pageNum, limitNum, populateFields = [],selectFields = {}) {
    ////console.log('dfgh', filterCon, sortCon, pageNum, limitNum, populateFields,selectFields);
    let query;
    sortCon = Object.keys(sortCon).length === 0 ? { createdAt: -1 } : sortCon;
    if(pageNum > 0){
    query = this.model
      .find(filterCon)
      .select(selectFields)
      .sort(sortCon)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .collation({ locale: 'en', strength: 2 });
    }else{
      query = this.model
      .find(filterCon)
      .select(selectFields)
      .sort(sortCon)
      .collation({ locale: 'en', strength: 2 });
    }
    

    // Populate fields if any
    if (populateFields?.length > 0 && Object.keys(selectFields).length === 0) {
      populateFields?.forEach((field) => {
      query = query.populate(field);
      });
    }

    ////console.log('query', query);
    const result = await query;
    // Get the total count of documents matching the filter
    const totalDocuments = await this.model.countDocuments(filterCon);

    return {
      result,
      currentPage: pageNum,
      totalPages: Math.ceil(totalDocuments / limitNum),
      totalDocuments,
    };
  }

  async update(id, data) {
    try {
      ////console.log('id', id);
      ////console.log('data', data);
      ////console.log('model', this.model);
      
      // For nested subdocuments like comparison.rows, use $set operator to ensure all fields are saved
      if (data.comparison && typeof data.comparison === 'object') {
        // Convert comparison to plain object and ensure whyExcels is always present
        const comparisonData = JSON.parse(JSON.stringify(data.comparison));
        
        // Remove any unwanted properties like "default"
        delete comparisonData.default;
        
        // Ensure all rows have whyExcels field explicitly set
        if (comparisonData.rows && Array.isArray(comparisonData.rows)) {
          comparisonData.rows = comparisonData.rows.map(row => ({
            title: row.title || '',
            cells: Array.isArray(row.cells) ? row.cells : [],
            note: row.note !== undefined && row.note !== null ? String(row.note) : '',
            whyExcels: row.whyExcels !== undefined && row.whyExcels !== null ? String(row.whyExcels) : '', // Always include whyExcels
          }));
        }
        
        console.log('[CrudRepository] Comparison data to save:', JSON.stringify(comparisonData.rows?.map(r => ({ title: r.title, whyExcels: r.whyExcels })), null, 2));
        
        // Prepare update data - separate comparison from other fields
        const updateData = { ...data };
        delete updateData.comparison;
        
        // Combine all updates into a single $set operation to avoid race conditions
        const finalUpdate = {
          $set: {
            ...updateData,
            'comparison.headers': comparisonData.headers || [],
            'comparison.rows': comparisonData.rows || [],
          }
        };
        
        console.log('[CrudRepository] Final update - comparison.rows:', JSON.stringify(finalUpdate.$set['comparison.rows']?.map(r => ({ title: r.title, whyExcels: r.whyExcels })), null, 2));
        
        // First update other fields using Mongoose (which handles ObjectId conversion)
        if (Object.keys(updateData).length > 0) {
          await this.model.findByIdAndUpdate(id, { $set: updateData }, { runValidators: true });
        }
        
        // Then update comparison using raw MongoDB - get the actual ObjectId from Mongoose
        const doc = await this.model.findById(id);
        if (!doc) {
          throw new Error('Document not found');
        }
        const objectId = doc._id;
        
        console.log('[CrudRepository] Updating document with _id:', objectId, 'type:', typeof objectId, 'constructor:', objectId?.constructor?.name);
        
        // Use raw MongoDB update to ensure all fields are saved (bypasses Mongoose validation)
        const updateResult = await this.model.collection.updateOne(
          { _id: objectId },
          {
            $set: {
              'comparison.headers': comparisonData.headers || [],
              'comparison.rows': comparisonData.rows || [],
            }
          }
        );
        console.log('[CrudRepository] MongoDB update result:', updateResult.modifiedCount, 'documents modified, matched:', updateResult.matchedCount);
        
        // Verify what was actually saved in MongoDB using raw collection query
        const rawSaved = await this.model.collection.findOne({ _id: objectId });
        console.log('[CrudRepository] Raw MongoDB data - comparison.rows:', JSON.stringify(rawSaved?.comparison?.rows?.map(r => ({ title: r.title, whyExcels: r.whyExcels, allKeys: Object.keys(r || {}) })), null, 2));
        
        // Use raw MongoDB data if available, otherwise fetch with Mongoose
        let result;
        if (rawSaved) {
          // Convert raw MongoDB document to plain object and merge with other fields
          result = { ...rawSaved };
          // Ensure _id is converted to string for consistency
          if (result._id) {
            result._id = result._id.toString();
            result.id = result._id.toString();
          }
        } else {
          // Fallback to Mongoose fetch
          result = await this.model.findById(id).lean({ minimize: false });
        }
        
        // Ensure whyExcels is present in comparison rows
        if (result && result.comparison && result.comparison.rows) {
          result.comparison.rows = result.comparison.rows.map((row, index) => {
            const originalRow = comparisonData.rows[index] || {};
            return {
              ...row,
              title: row.title || originalRow.title || '',
              cells: Array.isArray(row.cells) ? row.cells : (originalRow.cells || []),
              note: row.note !== undefined ? String(row.note) : (originalRow.note || ''),
              whyExcels: row.whyExcels !== undefined ? String(row.whyExcels) : (originalRow.whyExcels || ''), // Use original data if MongoDB doesn't have it
              _id: row._id || null,
              id: row.id || row._id || null,
            };
          });
        }
        
        console.log('[CrudRepository] Final result - comparison.rows:', JSON.stringify(result?.comparison?.rows?.map(r => ({ title: r.title, whyExcels: r.whyExcels })), null, 2));
        
        return result;
      }
      
      const result = await this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
      ////console.log('result',result);
      return result;
    } catch (error) {
      throw error;
    }
  }
}

export default CrudRepository;
