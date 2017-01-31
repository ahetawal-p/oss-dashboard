# Copyright (c) 2017, Salesforce.com, Inc. or its affiliates. All Rights Reserved.

#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at

#      http://www.apache.org/licenses/LICENSE-2.0

#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.


require_relative '../util.rb'

def reset_store_html(sync_db, endpoint)
	sync_db[ "DELETE FROM result_store where endpoint=?", endpoint].delete
end

def store_html(context, endpoint, html_content)
	sync_db = get_db_handle(context.dashboard_config)
	begin
		sync_db.transaction do
			reset_store_html(sync_db, endpoint)
			sync_db[ "INSERT INTO result_store (endpoint, html) VALUES (?, ?)", endpoint, html_content].insert
			context.feedback.print "Updated html content for #{endpoint} \n"
		end
	end
	rescue => e
      puts "Error during processing: #{$!}"
      puts "Backtrace:\n\t#{e.backtrace.join("\n\t")}"
end
