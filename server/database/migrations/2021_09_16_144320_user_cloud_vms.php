<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UserCloudVms extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('user_cloud_vms', function (Blueprint $table) {
			$table->unsignedBigInteger('topic_node_id');
            $table->dropColumn('lab_lesson_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('user_cloud_vms', function (Blueprint $table) {
            //
        });
    }
}
