<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCloudConfigsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('cloud_configs', function (Blueprint $table) {
            $table->id();
			$table->foreignId('cloud_id')->constrained()      ->onUpdate('cascade')->onDelete('cascade');
			$table->string('name', 64);
			$table->string('value', 512);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('cloud_configs');
    }
}
